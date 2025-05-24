import requests
import json

# === 🔐 Your OpenRouter API Key ===
API_KEY = "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" #mistralai/mistral-7b-instruct

# === 📄 Load matched rules ===
with open("ai_service/data/patients/matched_rules_for_patient_1.txt", "r", encoding="utf-8") as f:
    rules = [line.strip() for line in f if line.strip()]

# === 📝 Prepare the output file ===
output_file = open("llm_patient_report.txt", "w", encoding="utf-8")

# === 📤 Send each rule to the LLM ===
headers = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json"
}

for i, rule in enumerate(rules, start=1):
    print(f"\n🔄 Processing Rule {i}...")

    prompt = f"""
🧠 Rule {i}:
{rule}

Please perform the following tasks:
1. 📘 Explain the rule in clear professional **English**. Focus on the meaning of the lab markers.
3. 🧪 Suggest 1-2 **follow-up medical tests**.
4. 🩺 Provide 1-2 **medical recommendations**.

Only use medical logic, not translation. Do not explain the rule format. Explain its meaning.
"""

    data = {
        "model": "meta-llama/llama-3-8b-instruct",  # Or another model from OpenRouter
        "messages": [
            {"role": "system", "content": "You are a helpful medical assistant."},
            {"role": "user", "content": prompt}
        ]
    }

    try:
        response = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers=headers,
            data=json.dumps(data)
        )
        response.raise_for_status()
        reply = response.json()["choices"][0]["message"]["content"]

        print(f"✅ Rule {i} explained.")
        output_file.write(f"🧠 Rule {i}:\n{rule}\n\n{reply}\n\n{'='*80}\n\n")

    except Exception as e:
        print("❌ Error:", e)
        output_file.write(f"❌ Failed to explain Rule {i}: {rule}\nError: {str(e)}\n\n")

output_file.close()
print("\n✅ All rule explanations saved to llm_patient_report.txt")
