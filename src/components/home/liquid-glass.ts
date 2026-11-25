/*
 * Refractive glass for the landing page. Each panel gets an SVG displacement
 * map shaped like its own rounded rectangle, so the backdrop bends at the bezel
 * and stays straight through the middle. Only Chromium renders url() in
 * backdrop-filter; every other browser keeps the plain blur from the stylesheet.
 */

const SVG_NS = "http://www.w3.org/2000/svg";
const BEZEL_PX = 30;
const MAX_OFFSET_PX = 42;
const MAP_SCALE = 0.5;

/** Unit vector, scaled by strength, pointing from the bezel toward the centre. */
export function refractionAt(
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  bezel: number,
): [number, number] {
  const edgeX = Math.abs(x - width / 2) - (width / 2 - radius);
  const edgeY = Math.abs(y - height / 2) - (height / 2 - radius);
  const outside = Math.hypot(Math.max(edgeX, 0), Math.max(edgeY, 0));
  const depth = radius - outside - Math.min(Math.max(edgeX, edgeY), 0);
  if (depth <= 0 || depth >= bezel) return [0, 0];

  const inCorner = edgeX > 0 && edgeY > 0;
  const normalX = inCorner ? edgeX / outside : edgeX > edgeY ? 1 : 0;
  const normalY = inCorner ? edgeY / outside : edgeX > edgeY ? 0 : 1;
  const strength = (1 - depth / bezel) ** 2;

  return [
    -Math.sign(x - width / 2) * normalX * strength,
    -Math.sign(y - height / 2) * normalY * strength,
  ];
}

function displacementMap(
  width: number,
  height: number,
  radius: number,
): string {
  const mapWidth = Math.ceil(width * MAP_SCALE);
  const mapHeight = Math.ceil(height * MAP_SCALE);
  const canvas = document.createElement("canvas");
  canvas.width = mapWidth;
  canvas.height = mapHeight;
  const context = canvas.getContext("2d");
  if (!context) return "";

  const image = context.createImageData(mapWidth, mapHeight);
  const bezel = Math.min(BEZEL_PX, radius);
  for (let row = 0; row < mapHeight; row += 1) {
    for (let column = 0; column < mapWidth; column += 1) {
      const [dx, dy] = refractionAt(
        column / MAP_SCALE,
        row / MAP_SCALE,
        width,
        height,
        radius,
        bezel,
      );
      const pixel = (row * mapWidth + column) * 4;
      image.data[pixel] = 128 + dx * 127;
      image.data[pixel + 1] = 128 + dy * 127;
      image.data[pixel + 2] = 128;
      image.data[pixel + 3] = 255;
    }
  }
  context.putImageData(image, 0, 0);
  return canvas.toDataURL("image/png");
}

function svgElement(name: string, attributes: Record<string, string>): Element {
  const element = document.createElementNS(SVG_NS, name);
  for (const [key, value] of Object.entries(attributes)) {
    element.setAttribute(key, value);
  }
  return element;
}

/** Touch devices skip refraction: it is GPU-heavy and the blur reads well there. */
export function supportsRefraction(): boolean {
  return (
    /Chrome\//.test(navigator.userAgent) &&
    window.matchMedia("(pointer: fine)").matches &&
    !window.matchMedia("(prefers-reduced-transparency: reduce)").matches
  );
}

export function attachRefraction(
  element: HTMLElement,
  host: SVGSVGElement,
  id: string,
): () => void {
  const filter = svgElement("filter", {
    id,
    x: "0",
    y: "0",
    filterUnits: "userSpaceOnUse",
    "color-interpolation-filters": "sRGB",
  });
  const map = svgElement("feImage", {
    x: "0",
    y: "0",
    preserveAspectRatio: "none",
    result: "map",
  });
  const brightness = svgElement("feComponentTransfer", { in: "vivid" });
  for (const channel of ["feFuncR", "feFuncG", "feFuncB"]) {
    brightness.append(svgElement(channel, { type: "linear", slope: "1.15" }));
  }
  filter.append(
    map,
    svgElement("feGaussianBlur", {
      in: "SourceGraphic",
      stdDeviation: "4",
      result: "soft",
    }),
    svgElement("feDisplacementMap", {
      in: "soft",
      in2: "map",
      scale: String(MAX_OFFSET_PX * 2),
      xChannelSelector: "R",
      yChannelSelector: "G",
      result: "bent",
    }),
    svgElement("feColorMatrix", {
      in: "bent",
      type: "saturate",
      values: "1.7",
      result: "vivid",
    }),
    brightness,
  );
  host.append(filter);

  const render = (): void => {
    const width = element.offsetWidth;
    const height = element.offsetHeight;
    if (!width || !height) return;
    const declared = parseFloat(getComputedStyle(element).borderTopLeftRadius);
    const radius = Math.min(declared || 0, width / 2, height / 2);
    filter.setAttribute("width", String(width));
    filter.setAttribute("height", String(height));
    map.setAttribute("width", String(width));
    map.setAttribute("height", String(height));
    map.setAttribute("href", displacementMap(width, height, radius));
    element.style.setProperty("--landing-glass-filter", `url(#${id})`);
  };

  const observer = new ResizeObserver(render);
  observer.observe(element);

  return () => {
    observer.disconnect();
    element.style.removeProperty("--landing-glass-filter");
    filter.remove();
  };
}
