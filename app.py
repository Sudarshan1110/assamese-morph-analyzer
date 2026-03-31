from flask import Flask, render_template, request, jsonify
from analyzer import MorphAnalyzer

app = Flask(__name__)
analyzer = MorphAnalyzer("unimorph_clean.json")


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/analyze", methods=["POST"])
def analyze():
    data = request.json
    text = data.get("text", "")

    results = analyzer.analyze(text)

    return jsonify(results)


@app.route("/suggest", methods=["POST"])
def suggest():
    data = request.json
    prefix = data.get("prefix", "")

    suggestions = analyzer.suggest(prefix)

    return jsonify(suggestions)


if __name__ == "__main__":
    app.run(debug=True)