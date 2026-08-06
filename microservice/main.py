import os
import math
import re
import urllib.parse
from typing import List, Optional
import requests
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="AdReel AI Microservice", description="Free embeddings and image generation service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Optional local SentenceTransformer model load
model = None
try:
    from sentence_transformers import SentenceTransformer
    print("Loading sentence-transformers/all-MiniLM-L6-v2 model...")
    model = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')
    print("SentenceTransformer loaded successfully.")
except Exception as e:
    print(f"Local sentence-transformers not initialized ({e}), will use fallback/HF inference.")

class EmbedRequest(BaseModel):
    text: str

class EmbedResponse(BaseModel):
    embedding: List[float]
    dimensions: int

class ImageRequest(BaseModel):
    prompt: str
    aspect_ratio: Optional[str] = "1:1"
    color_palette: Optional[List[str]] = None
    negative_prompt: Optional[str] = "blurry, low quality, distorted, watermark, deformed text"

class ImageResponse(BaseModel):
    url: str
    status: str
    prompt: str
    aspect_ratio: str

def normalize_vector(vec: List[float]) -> List[float]:
    norm = math.sqrt(sum(x * x for x in vec)) or 1e-9
    return [round(x / norm, 6) for x in vec]

def deterministic_embed(text: str, dim: int = 384) -> List[float]:
    vec = [0.0] * dim
    words = re.findall(r'[a-zA-Z0-9]+', text.lower())
    if not words:
        return normalize_vector([0.01 if i % 2 == 0 else -0.01 for i in range(dim)])
    
    for i, word in enumerate(words):
        weight = 1.0 / math.sqrt(i + 1)
        for c_idx, ch in enumerate(word):
            code = ord(ch)
            idx1 = (code * 31 + c_idx * 17 + i * 13) % dim
            idx2 = (code * 59 + c_idx * 23 + i * 29) % dim
            vec[idx1] += math.sin(code + i) * weight
            vec[idx2] += math.cos(code + c_idx) * weight
            
        if i < len(words) - 1:
            bigram = f"{word}_{words[i+1]}"
            b_hash = sum(ord(c) * (31 ** idx) for idx, c in enumerate(bigram))
            vec[abs(b_hash) % dim] += 1.5
            
    return normalize_vector(vec)

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "AdReel AI Microservice",
        "has_local_model": model is not None
    }

@app.post("/embed", response_model=EmbedResponse)
def generate_embedding(req: EmbedRequest):
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")

    clean_text = req.text.strip()

    # 1. Try loaded local model
    if model is not None:
        try:
            emb = model.encode(clean_text).tolist()
            return EmbedResponse(embedding=normalize_vector(emb), dimensions=384)
        except Exception as e:
            print(f"Local inference failed: {e}")

    # 2. Try Hugging Face free inference API
    try:
        hf_res = requests.post(
            "https://api-inference.huggingface.co/pipeline/feature-extraction/sentence-transformers/all-MiniLM-L6-v2",
            json={"inputs": clean_text},
            timeout=5
        )
        if hf_res.status_code == 200:
            hf_emb = hf_res.json()
            if isinstance(hf_emb, list) and len(hf_emb) == 384:
                return EmbedResponse(embedding=normalize_vector(hf_emb), dimensions=384)
    except Exception as e:
        print(f"HF inference error: {e}")

    # 3. Fallback deterministic embedding
    emb = deterministic_embed(clean_text, 384)
    return EmbedResponse(embedding=emb, dimensions=384)

@app.post("/generate-image", response_model=ImageResponse)
def generate_image(req: ImageRequest):
    if not req.prompt.strip():
        raise HTTPException(status_code=400, detail="Prompt cannot be empty")

    prompt = req.prompt.strip()
    
    # Calculate dimensions based on aspect ratio
    width, height = 1024, 1024
    if req.aspect_ratio == "9:16":
        width, height = 720, 1280
    elif req.aspect_ratio == "4:5":
        width, height = 864, 1080
    elif req.aspect_ratio == "16:9":
        width, height = 1280, 720
    elif req.aspect_ratio == "1:1":
        width, height = 1024, 1024

    # Enhance prompt with color palette if provided
    enhanced_prompt = prompt
    if req.color_palette and len(req.color_palette) > 0:
        palette_str = ", ".join(req.color_palette)
        enhanced_prompt += f", color theme: {palette_str}"

    enhanced_prompt += ", highly detailed, professional commercial photography, 8k resolution, photorealistic"
    
    # URL-encode prompt for free Stable Diffusion Turbo / FLUX image generation via Pollinations
    encoded_prompt = urllib.parse.quote(enhanced_prompt)
    image_url = f"https://image.pollinations.ai/prompt/{encoded_prompt}?width={width}&height={height}&nologo=true&enhance=true&model=flux"

    return ImageResponse(
        url=image_url,
        status="complete",
        prompt=req.prompt,
        aspect_ratio=req.aspect_ratio or "1:1"
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
