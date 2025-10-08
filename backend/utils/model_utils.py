import torch
import os

MODEL_DIR = "models"
os.makedirs(MODEL_DIR, exist_ok=True)

def save_model(agent, filename="pretrained_agent.pth"):
    path = os.path.join(MODEL_DIR, filename)
    torch.save(agent.model.state_dict(), path)
    print(f"✅ Model saved at {path}")

def load_model(agent, filename="pretrained_agent.pth"):
    path = os.path.join(MODEL_DIR, filename)
    if os.path.exists(path):
        agent.model.load_state_dict(torch.load(path))
        print(f"✅ Loaded pretrained model from {path}")
        return True
    print("⚠️ No pretrained model found.")
    return False
