import React, { useEffect } from "react";

/**
 * JsonLd — injects a JSON-LD structured-data script into <head>.
 * Renders nothing visible. Stable across renders (depends on the JSON string).
 */
export default function JsonLd({ data }) {
  const json = JSON.stringify(data);
  useEffect(() => {
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.text = json;
    document.head.appendChild(script);
    return () => {
      if (script.parentNode) script.parentNode.removeChild(script);
    };
  }, [json]);
  return null;
}