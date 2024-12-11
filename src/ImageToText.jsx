import React, { useState, useEffect, useRef } from "react";
import { HfInference } from "@huggingface/inference";

const inference = new HfInference("(insert hf api)");

const ImageToText = () => {
  const [imageUrl, setImageUrl] = useState("");
  const [fontName, setFontName] = useState(""); // State to hold the font name
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [boldness, setBoldness] = useState(400); // Default font weight
  const [fontSize, setFontSize] = useState(30); // Default font size
  const [fontColor, setFontColor] = useState("#000000"); // Default font color
  const canvasRef = useRef(null); // Ref for the canvas element

  const describeImage = async (url) => {
    const messages = [
      {
        role: "user",
        content: [
          { type: "image_url", image_url: { url: url } },
          { type: "text", text: "which google font does the image resemble the most among the following fonts:roboto,creepster,lato,pacifico.answer in one word" },
        ],
      },
    ];

    setLoading(true);
    setError("");
    setFontName(""); // Reset font name when starting
    const responseChunks = [];

    try {
      for await (const chunk of inference.chatCompletionStream({
        model: "meta-llama/Llama-3.2-11B-Vision-Instruct",
        messages: messages,
        max_tokens: 500,
      })) {
        responseChunks.push(chunk.choices[0]?.delta?.content || "");
      }
      const finalDescription = responseChunks.join("");
      setFontName(finalDescription); // Set the detected font name
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
    const formattedFontName = fontName.replace(/ /g, "+");
    const link = document.createElement("link");
    link.href = `https://fonts.googleapis.com/css2?family=${formattedFontName}&display=swap`;
    link.rel = "stylesheet";
    document.head.appendChild(link);
  };

  const drawFontOnCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    
    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (fontName) {
      ctx.font = `${boldness} ${fontSize}px '${fontName}', cursive`; // Use boldness and fontSize
      ctx.fillStyle = fontColor; // Set text color
      ctx.fillText("This text uses the detected font!", 20, 100); // Draw text on canvas
    }
  };

  useEffect(() => {
    if (fontName) {
      loadGoogleFont(fontName);
      drawFontOnCanvas(); // Draw the font on the canvas when fontName changes
    }
  }, [fontName, boldness, fontSize, fontColor]); // Re-draw when fontName, boldness, fontSize, or color changes

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

      {/* Increased Canvas Size */}
      <canvas ref={canvasRef} width={800} height={300} style={{ border: "1px solid black" }} />

      {/* Controls for adjusting font properties */}
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
