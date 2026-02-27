document.addEventListener("DOMContentLoaded", function () {
  document.querySelectorAll(
    "article h1, article h2, article h3, article p, article pre, article ul, article ol, article table"
  ).forEach(function (el, index) {
    if (!el.hasAttribute("data-aos")) {
      el.setAttribute("data-aos", "fade-up");
      el.setAttribute("data-aos-delay", (index % 5) * 100);
    }
  });

  AOS.init({
    duration: 800,
    easing: "ease-in-out",
    once: true,
    offset: 0
  });
});
