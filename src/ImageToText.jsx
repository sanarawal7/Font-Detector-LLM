import React, { useState } from "react";
import { HfInference } from "@huggingface/inference";

const inference = new HfInference("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");

const ImageToText = () => {
  const [imageUrl, setImageUrl] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const describeImage = async (url) => {
    const messages = [
      {
        role: "user",
        content: [
          { type: "image_url", image_url: { url: url } },
          { type: "text", text: "give me the font name used in the image" },
        ],
      },
    ];

    setLoading(true);
    setError("");
    setDescription("");

    try {
      const responseChunks = [];
      for await (const chunk of inference.chatCompletionStream({
        model: "meta-llama/Llama-3.2-11B-Vision-Instruct",
        messages: messages,
        max_tokens: 500,
      })) {
        responseChunks.push(chunk.choices[0]?.delta?.content || "");
      }
      const finalDescription = responseChunks.join("");
      setDescription(finalDescription);
    } catch (err) {
      console.error("Error hae:", err);
      setError("image mae error aa gya.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (imageUrl) {
      describeImage(imageUrl);
    } else {
      setError("image ke sath text v dho");
    }
  };

  return (
    <div>
      <h1>Get Font details</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="url"
          placeholder="image URL dalo"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? "Loading..." : "Find Font"}
        </button>
      </form>
      {description && (
        <p>
          <strong>Description:</strong> {description}
        </p>
      )}
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
};

export default ImageToText;
