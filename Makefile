HOST_IP := $(shell hostname -I | awk '{print $$1}')

.PHONY: serve build

serve:
	hugo server -D --bind 0.0.0.0 --baseURL http://$(HOST_IP)

build:
	hugo --minify
