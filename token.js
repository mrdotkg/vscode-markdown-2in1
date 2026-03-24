const get = (sel, prop) => {
  const el = document.querySelector(sel);
  return el ? getComputedStyle(el).getPropertyValue(prop).trim() : null;
};

const tokens = {
  // Typography
  "font-body": get("p", "font-family"),
  "font-heading": get("h1", "font-family"),
  "font-code": get("code", "font-family"),
  "font-size-base": get("p", "font-size"),
  "font-size-h1": get("h1", "font-size"),
  "font-size-h2": get("h2", "font-size"),
  "font-size-h3": get("h3", "font-size"),
  "font-weight-heading": get("h1", "font-weight"),
  "font-weight-body": get("p", "font-weight"),
  "line-height-body": get("p", "line-height"),
  "line-height-heading": get("h1", "line-height"),
  "letter-spacing-h1": get("h1", "letter-spacing"),
  "letter-spacing-body": get("p", "letter-spacing"),
  // Colors
  "color-bg": get("body", "background-color"),
  "color-text": get("p", "color"),
  "color-heading": get("h1", "color"),
  "color-link": get("a", "color"),
  "color-code-bg": get("code", "background-color"),
  "color-code-text": get("code", "color"),
  "color-blockquote-bg": get("blockquote", "background-color"),
  "color-blockquote-border": get("blockquote", "border-left-color"),
  // Spacing
  "space-content-width": get("body", "max-width"),
  "space-paragraph-gap": get("p", "margin-bottom"),
  "space-heading-top": get("h2", "margin-top"),
  // Borders
  "radius-code": get("code", "border-radius"),
  "border-blockquote": get("blockquote", "border-left"),
};

// :root block print karo
let css = ":root {\n";
for (const [k, v] of Object.entries(tokens))
  if (v) css += `  --b-${k}: ${v};\n`;
css += "}";
console.log(css);
