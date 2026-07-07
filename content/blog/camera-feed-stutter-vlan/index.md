---
title: "The Camera Feed Stutter That Wasn't a Network Problem (Until It Was)"
aliases: ["/posts/camera-feed-stutter-vlan/"]
date: 2026-07-07
lastUpdated: "2026-07-07"
draft: false
description: "My Home Assistant camera stuttered only across VLANs. iperf3 showed 1.87 Gbps, 0% loss. The real cause: a moving WebRTC port my firewall rule never covered."
summary: "A camera feed that stuttered only across VLANs, and the elimination process that found the real cause. iperf3 was clean, the proxy bypass changed nothing, two competing camera integrations were muddying every test, and go2rtc's WebRTC media connection never had a path through the firewall."
coverImage: "https://images.unsplash.com/photo-1695668548342-c0c1ad479aee?w=1200&h=630&fit=crop&q=80&fm=webp"
coverImageAlt: "Dark server rack with illuminated network equipment and patch cables"
tags:
  - home-assistant
  - go2rtc
  - webrtc
  - opnsense
  - vlan
  - homelab
  - networking
  - incident-response
images: ["/blog/camera-feed-stutter-vlan/og-card.png"]
---

*By [Skyler King](/docs/bio/), CCNA-certified network engineering student at WGU, building toward a career in cloud and hybrid networking.*

My Home Assistant camera tile stutters every couple of seconds. Not offline, not frozen, just a steady little hitch, like the video is skipping a frame on a loop. It only happens when I'm viewing it from a device on a different VLAN than the camera. From the camera's own VLAN, it's glass-smooth.

That pattern (fine here, broken there, same feed) is the exact shape of a routing problem. So that's where I started looking. It took me most of an evening to find out I was looking in the wrong place.

> **TL;DR:** iperf3 across the VLANs came back clean: 1.87 Gbps, 0% loss. Bypassing my reverse proxy produced the identical stutter, which ruled out both the network and the proxy. The actual cause: Home Assistant's live view runs on go2rtc, which negotiates a separate WebRTC media connection outside the reverse proxy entirely, a well-documented WebRTC firewall trap ([webrtcHacks](https://webrtchacks.com/an-intro-to-webrtcs-natfirewall-problem/)). A packet capture on my firewall showed that connection landing on a different port every session, not the port go2rtc's own docs list as the default. The fix was a rule that allows Home Assistant out on any port, scoped to that one device.

## What Happened

OPNsense handles routing and firewalling here, with Traefik sitting in front of Home Assistant as a reverse proxy. Like most things in this lab, it's all carved up into [VLANs](/blog/vpn-vs-vlan/), including the one Tapo camera feeding into Home Assistant. I like keeping traffic segmented, and it turns out that's also exactly the kind of setup that makes a bug like this possible in the first place.

The stutter was consistent enough to test. Every device on the camera's own VLAN: smooth. Every device on any other VLAN: the same hitch, every few seconds, no matter which client I checked from.

A cross-VLAN symptom means cross-VLAN testing. First test, always: is the network actually the bottleneck? I ran iperf3 between the two VLANs and got 1.87 Gbps at 0% packet loss. That's not a network with a problem. That's a network that's bored.

Second test: cut the reverse proxy out of the loop and hit Home Assistant's IP directly. Same stutter, exactly. That ruled out two suspects in one step: the raw network path and the Traefik proxy sitting in front of it. Both came back clean, and I still had a stuttering camera feed.

## A Second Variable I Didn't Notice Right Away

Before I could trust any of that testing, I found something that had been quietly corrupting it: some devices were pulling the camera feed through a different Home Assistant integration than others. Two integrations, same camera, and I hadn't standardized on one.

That's the kind of thing that makes "the pattern" lie to you. Once I forced everything onto a single integration, the result actually meant something: smooth on the camera's VLAN, stuttering everywhere else, consistently, across every device I tested. Clean signal, finally.

## The Clue Was in DevTools, Not the Terminal

I should have opened browser DevTools a lot sooner than I did. The network tab is where the actual answer was sitting the entire time.

Video segment requests (`.m4s`) loaded instantly. Playlist requests (`.m3u8`) were taking almost a full second each, over and over, on a cycle. A bandwidth problem wouldn't be that selective about which requests it slowed down. Something was failing and retrying on a timer.

## What go2rtc Is Actually Doing

Home Assistant's live camera view doesn't talk to the camera directly. It runs through [go2rtc](https://github.com/AlexxIT/go2rtc), which negotiates a WebRTC session for low-latency playback. WebRTC firewall problems are common enough to have their [own dedicated writeups](https://webrtchacks.com/an-intro-to-webrtcs-natfirewall-problem/): signaling and media are separate connections. A firewall rule built around the signaling path alone will pass every handshake and still drop every frame.

In my setup, that split looks like this:

```
Browser → Traefik → Home Assistant     (signaling: negotiates the session, rides the proxy fine)
Browser → Home Assistant, direct       (media: the actual video, its own port, bypasses the proxy)
```

Signaling goes through Traefik without complaint. It's just HTTP, and it's what DevTools shows succeeding instantly. The media connection is the one that opens straight to Home Assistant on a port of its own, and that's the connection my firewall rule had never heard of.

The obvious next move was to look up go2rtc's documented default and open exactly that. Standalone go2rtc lists `8555` (TCP and UDP) for WebRTC, alongside `1984` for its web UI and `8554` for RTSP ([go2rtc documentation](https://github.com/AlexxIT/go2rtc/blob/master/internal/webrtc/README.md)). So I opened `8555`. Nothing changed.

That's when I stopped trusting the docs and put a packet capture on the OPNsense box itself. The WebRTC media stream wasn't touching `8555` at all. It was landing on a different port every time I reloaded the camera tile. Whatever ICE candidate go2rtc negotiated for that connection changed from session to session.

## The Fix: a Rule That Only Covered the Web UI

My OPNsense rule for cross-VLAN access to Home Assistant allowed one thing: TCP `8123`, the web UI. That's the port you'd write down if someone asked "what port does Home Assistant use." The video doesn't ride on that port, though, and there wasn't a second single port to add in its place.

| What I assumed | What was actually true |
|---|---|
| Home Assistant only needs port 8123 open | go2rtc opens a separate WebRTC media connection, on a port that isn't fixed |
| One camera integration was in use | Two were running, quietly feeding the same camera to different devices |
| The documented WebRTC port would be the one to open | Packet captures showed it landing somewhere different every session |

Pinning a rule to a moving target doesn't work, so I didn't try. The fix was to allow Home Assistant out on any port, scoped specifically to that one device instead of the network at large. Playback smoothed out on every VLAN immediately.

{{< figure
  src="https://images.unsplash.com/photo-1549109926-58f039549485?w=1200&h=630&fit=crop&q=80&fm=webp"
  alt="White security camera mounted on an exterior wall"
  caption="The camera, pictured here being blameless. The problem was a port nobody wrote down."
>}}

## The Rule I Write Now

There's no port number to memorize here; mine wasn't fixed long enough to memorize anyway. The mistake was writing a firewall rule for the port I already knew instead of the ports the service actually uses, and for anything doing WebRTC or ICE negotiation, that number can genuinely move from session to session. Sometimes the honest fix is a scoped-but-open rule rather than a tighter one. I already do [cross-VLAN traffic auditing](/blog/cross-vlan-network-monitor/) in this lab specifically because ARP and assumptions don't reach across VLAN boundaries. This is the same lesson from a different angle: check what a service actually does on the wire before you write a rule for what you assume it does.

Every new self-hosted service that touches more than one VLAN in my [lab now gets a documentation-versus-reality check](/blog/opnsense-backup-incident/) before I trust the "obvious" port to be the whole story.

---

## Frequently Asked Questions

### Why does a Home Assistant camera feed only stutter on some VLANs?

Home Assistant's live view runs through go2rtc, which negotiates a WebRTC session with a separate media connection outside the reverse proxy. If a firewall rule only covers the web UI port, devices on VLANs without a rule broad enough for that media connection will see the video fail while signaling still succeeds. The result is a stutter that looks network-related but is actually a missing firewall path.

### What port does go2rtc need open for WebRTC?

Documentation lists `8555` (TCP and UDP) as the standalone default, alongside `1984` for the web UI and `8554` for RTSP ([go2rtc documentation](https://github.com/AlexxIT/go2rtc/blob/master/internal/webrtc/README.md)). That default doesn't always hold in practice: a packet capture on my own firewall showed the WebRTC media connection landing on a different port every session. If you see the same thing, don't chase a moving port: scope a rule that allows the Home Assistant host on any port instead, specific to the device that needs it.

### How do you tell whether a stutter is a network problem or an application problem?

Test the cheapest, most decisive layers first. Run iperf3 across the relevant network path to rule out raw throughput and packet loss, then bypass any reverse proxy and hit the service directly. If the symptom persists in both tests, the network and proxy are both innocent, and the cause is somewhere in the application's own connection handling.

### Why did bypassing the reverse proxy show the exact same stutter?

Because the reverse proxy only carries the WebRTC signaling connection. The media connection, the actual video, opens directly to the origin server on its own port, bypassing the proxy entirely. An issue on that media path shows up identically whether the proxy is in the loop or not, which is why bypassing it ruled out the proxy without touching the actual cause.

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "BlogPosting",
      "@id": "https://moshthesubnet.com/blog/camera-feed-stutter-vlan/#article",
      "headline": "The Camera Feed Stutter That Wasn't a Network Problem (Until It Was)",
      "description": "My Home Assistant camera stuttered only across VLANs. iperf3 showed 1.87 Gbps, 0% loss. The real cause: a moving WebRTC port my firewall rule never covered.",
      "datePublished": "2026-07-07T00:00:00Z",
      "dateModified": "2026-07-07T00:00:00Z",
      "author": {
        "@type": "Person",
        "@id": "https://moshthesubnet.com/#author",
        "name": "Skyler",
        "url": "https://moshthesubnet.com"
      },
      "publisher": {
        "@type": "Organization",
        "@id": "https://moshthesubnet.com/#organization",
        "name": "moshthesubnet",
        "url": "https://moshthesubnet.com"
      },
      "image": {
        "@type": "ImageObject",
        "url": "https://images.unsplash.com/photo-1695668548342-c0c1ad479aee?w=1200&h=630&fit=crop&q=80&fm=webp",
        "width": 1200,
        "height": 630,
        "caption": "Dark server rack with illuminated network equipment and patch cables"
      },
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": "https://moshthesubnet.com/blog/camera-feed-stutter-vlan/"
      },
      "articleSection": "Homelab",
      "keywords": ["Home Assistant", "go2rtc", "WebRTC", "OPNsense", "VLAN", "homelab", "networking", "firewall", "incident response"],
      "inLanguage": "en-US"
    },
    {
      "@type": "BreadcrumbList",
      "@id": "https://moshthesubnet.com/blog/camera-feed-stutter-vlan/#breadcrumb",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": "https://moshthesubnet.com"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "Posts",
          "item": "https://moshthesubnet.com/blog/"
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": "The Camera Feed Stutter That Wasn't a Network Problem (Until It Was)",
          "item": "https://moshthesubnet.com/blog/camera-feed-stutter-vlan/"
        }
      ]
    },
    {
      "@type": "FAQPage",
      "@id": "https://moshthesubnet.com/blog/camera-feed-stutter-vlan/#faq",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "Why does a Home Assistant camera feed only stutter on some VLANs?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Home Assistant's live view runs through go2rtc, which negotiates a WebRTC session with a separate media connection outside the reverse proxy. If a firewall rule only covers the web UI port, devices on VLANs without a rule broad enough for that media connection will see the video fail while signaling still succeeds. The result is a stutter that looks network-related but is actually a missing firewall path."
          }
        },
        {
          "@type": "Question",
          "name": "What port does go2rtc need open for WebRTC?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Documentation lists 8555 (TCP and UDP) as the standalone default, alongside 1984 for the web UI and 8554 for RTSP. That default doesn't always hold in practice: a packet capture on the firewall can show the WebRTC media connection landing on a different port every session. If that happens, don't chase a moving port. Scope a rule that allows the Home Assistant host on any port instead, specific to the device that needs it."
          }
        },
        {
          "@type": "Question",
          "name": "How do you tell whether a stutter is a network problem or an application problem?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Test the cheapest, most decisive layers first. Run iperf3 across the relevant network path to rule out raw throughput and packet loss, then bypass any reverse proxy and hit the service directly. If the symptom persists in both tests, the network and proxy are both innocent, and the cause is somewhere in the application's own connection handling."
          }
        },
        {
          "@type": "Question",
          "name": "Why did bypassing the reverse proxy show the exact same stutter?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "The reverse proxy only carries the WebRTC signaling connection. The media connection, the actual video, opens directly to the origin server on its own port, bypassing the proxy entirely. An issue on that media path shows up identically whether the proxy is in the loop or not, which is why bypassing it ruled out the proxy without touching the actual cause."
          }
        }
      ]
    }
  ]
}
</script>
