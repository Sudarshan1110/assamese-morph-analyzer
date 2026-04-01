from flask import Flask, render_template, request, jsonify
from analyzer import MorphAnalyzer

app = Flask(__name__)
analyzer = MorphAnalyzer("unimorph_clean.json")


# -------------------- HOME --------------------
@app.route("/")
def home():
    return render_template("index.html")


# -------------------- ANALYZE --------------------
@app.route("/analyze", methods=["POST"])
def analyze_text():
    try:
        data = request.get_json()
        text = data.get("text", "").strip()

        if not text:
            return jsonify({"error": "No input provided"}), 400

        results = analyzer.analyze(text)
        return jsonify(results)

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# -------------------- SUGGEST --------------------
@app.route("/suggest", methods=["POST"])
def suggest_words():
    try:
        data = request.get_json()
        prefix = data.get("prefix", "").strip()

        if not prefix:
            return jsonify([])

        suggestions = analyzer.suggest(prefix)
        return jsonify(suggestions)

    except Exception as e:
        return jsonify([])


# -------------------- RUN --------------------
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)