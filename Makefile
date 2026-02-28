HOST_IP := $(shell hostname -I | awk '{print $$1}')

.PHONY: serve build preview

serve:
	hugo server -D --bind 0.0.0.0 --baseURL http://$(HOST_IP):1313

build:
	hugo --minify

preview: build
	@echo "Previewing production build at http://$(HOST_IP):1313"
	python3 -m http.server 1313 --bind $(HOST_IP) --directory public
