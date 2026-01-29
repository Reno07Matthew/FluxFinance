from transformers import pipeline

# Load once globally
print("🧠 Loading FinBERT...")
bert = pipeline("sentiment-analysis", model="ProsusAI/finbert")

def analyze_sentiment(headlines):
    if not headlines: return {"score": 0, "label": "Neutral"}
    
    results = bert(headlines)
    total_score = 0
    
    # Logic: Positive=+1, Negative=-1, Neutral=0
    for res in results:
        if res['label'] == 'positive': total_score += res['score']
        elif res['label'] == 'negative': total_score -= res['score']
    
    avg = total_score / len(headlines)
    
    label = "Neutral"
    if avg > 0.15: label = "Positive"
    if avg < -0.15: label = "Negative"
    
    return {"score": round(avg, 2), "label": label}