# app.py - Flask web app for CSV upload and analysis

import os
from flask import Flask, request, render_template
import pandas as pd
from analysis import analyze_data

app = Flask(__name__)

# Folder to save uploaded files temporarily
UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


# ── Routes ─────────────────────────────────────────────────────

@app.route("/")
def home():
    """Render homepage."""
    return render_template("index.html")


@app.route("/upload", methods=["POST"])
def upload():
    """Handle CSV upload and analysis."""

    # Check if file exists
    if "file" not in request.files:
        return "<h3>No file uploaded.</h3>"

    file = request.files["file"]

    # Check if filename is empty
    if file.filename == "":
        return "<h3>No file selected.</h3>"

    # Allow only CSV files
    if not file.filename.endswith(".csv"):
        return "<h3>Please upload a CSV file only.</h3>"

    # Save uploaded file
    filepath = os.path.join(UPLOAD_FOLDER, file.filename)
    file.save(filepath)

    try:
        # Read CSV file
        df = pd.read_csv(filepath)

        # Analyze dataset
        result = analyze_data(df)

        # Create dataset preview
        preview = df.head().to_html(
            classes="table",
            index=False
        )

        # Return result page
        return f"""
        <!DOCTYPE html>
        <html lang="en">

        <head>
            <meta charset="UTF-8">
            <meta name="viewport"
                  content="width=device-width, initial-scale=1.0">

            <title>Analysis Result</title>

            <link rel="stylesheet"
                  href="/static/style.css">
        </head>

        <body>

            <div class="container">

                <div class="upload-card">

                    <h1 class="card-title">
                        Analysis Report
                    </h1>

                    <p class="card-subtitle">
                        Automated dataset analysis completed successfully.
                    </p>

                    <h3>Dataset Preview</h3>

                    {preview}

                    <h3 style="margin-top: 24px;">
                        Analysis Output
                    </h3>

                    <pre>{result}</pre>

                    <br>

                    <a href="/">
                        ← Analyze Another Dataset
                    </a>

                </div>

            </div>

        </body>
        </html>
        """

    except Exception as e:
        return f"<h3>Error: {str(e)}</h3>"

    finally:
        # Delete temporary uploaded file
        if os.path.exists(filepath):
            os.remove(filepath)


# ── Run Application ────────────────────────────────────────────

if __name__ == "__main__":
    app.run(debug=True)