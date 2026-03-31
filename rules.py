def apply_rules(word):
    results = []

    # simple Assamese suffix rules
    if word.endswith("টো"):
        results.append({
            "lemma": word[:-2],
            "pos": "N",
            "features": {
                "definiteness": "DEF",
                "number": "SG"
            },
            "source": "rule"
        })

    elif word.endswith("বোৰ"):
        results.append({
            "lemma": word[:-3],
            "pos": "N",
            "features": {
                "definiteness": "DEF",
                "number": "PL"
            },
            "source": "rule"
        })

    return results