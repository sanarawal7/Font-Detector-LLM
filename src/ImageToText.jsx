import React, { useState, useEffect, useRef } from "react";
import { HfInference } from "@huggingface/inference";

const inference = new HfInference("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");

const ImageToText = () => {
  const [imageUrl, setImageUrl] = useState("");
  const [fontName, setFontName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [boldness, setBoldness] = useState(400);
  const [fontSize, setFontSize] = useState(30);
  const [fontColor, setFontColor] = useState("#000000");
  const canvasRef = useRef(null);

  const describeImage = async (url) => {
    const messages = [
      {
        role: "user",
        content: [
          { type: "image_url", image_url: { url: url } },
          {
            type: "text",
            text: "Which Google font does the image resemble the most among the following fonts: Roboto, Creepster, Lato, Pacifico? Respond with exactly one of these font names only.",
          },
        ],
      },
    ];

    setLoading(true);
    setError("");
    setFontName("");
    const responseChunks = [];

    try {
      for await (const chunk of inference.chatCompletionStream({
        model: "meta-llama/Llama-3.2-11B-Vision-Instruct",
        messages: messages,
        max_tokens: 500,
      })) {
        responseChunks.push(chunk.choices[0]?.delta?.content || "");
      }
      const finalDescription = responseChunks.join("").trim();
      console.log("Raw response:", finalDescription);

      const cleanedResponse = finalDescription
        .replace(/\./g, "")
        .replace(/\n/g, "")
        .trim();
      console.log("Cleaned response:", cleanedResponse);

      const allowedFonts = ["Roboto", "Creepster", "Lato", "Pacifico"];
      const matchedFont = allowedFonts.find(
        (font) => cleanedResponse.toLowerCase() === font.toLowerCase()
      );

      console.log("Matched font:", matchedFont);

      if (matchedFont) {
        setFontName(matchedFont);
      } else {
        setError(`Invalid font name received: "${cleanedResponse}"`);
      }
    } catch (err) {
      console.error("Error:", err);
      setError("An error occurred while processing the image.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (imageUrl) {
      describeImage(imageUrl);
    } else {
      setError("Please provide an image URL.");
    }
  };

  const loadGoogleFont = (fontName) => {
    const cleanFontName = fontName.replace(/\s+/g, "+"); // Replace spaces with '+'
    const linkId = `google-font-${cleanFontName}`;
    if (!document.getElementById(linkId)) {
      const link = document.createElement("link");
      link.id = linkId;
      link.href = `https://fonts.googleapis.com/css2?family=${cleanFontName}&display=swap`;
      link.rel = "stylesheet";
      document.head.appendChild(link);
    }
  };

  const drawFontOnCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (fontName) {
      try {
        loadGoogleFont(fontName); // Ensure the font is loaded
        ctx.font = `${boldness} ${fontSize}px '${fontName}', sans-serif`;
        console.log("Applied font:", ctx.font);

        const text = "This text uses the detected font!";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = fontColor;
        ctx.fillText(text, canvas.width / 2, canvas.height / 2);
      } catch (err) {
        console.error("Canvas drawing error:", err);
        setError("Failed to draw text with the selected font");
      }
    }
  };

  useEffect(() => {
    if (fontName) {
      drawFontOnCanvas();
    }
  }, [fontName, boldness, fontSize, fontColor]);

  const downloadImage = () => {
    const canvas = canvasRef.current;
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = "font_image.png";
    link.click();
  };

  return (
    <div>
      <h1>Get Font Details</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="url"
          placeholder="Enter image URL"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? "Loading..." : "Find Font"}
        </button>
      </form>
      {fontName && (
        <p>
          <strong>Detected Font Name:</strong> {fontName}
        </p>
      )}
      {error && <p style={{ color: "red" }}>{error}</p>}

      <canvas
        ref={canvasRef}
        width={800}
        height={300}
        style={{ border: "1px solid black" }}
      />

      {fontName && (
        <div>
          <label>
            Boldness:
            <input
              type="range"
              min="100"
              max="900"
              step="100"
              value={boldness}
              onChange={(e) => setBoldness(e.target.value)}
            />
          </label>
          <label>
            Font Size:
            <input
              type="range"
              min="10"
              max="100"
              step="1"
              value={fontSize}
              onChange={(e) => setFontSize(e.target.value)}
            />
          </label>
          <label>
            Font Color:
            <input
              type="color"
              value={fontColor}
              onChange={(e) => setFontColor(e.target.value)}
            />
          </label>
          <button onClick={downloadImage}>Download Font Image</button>
        </div>
      )}
    </div>
  );
};

export default ImageToText;
