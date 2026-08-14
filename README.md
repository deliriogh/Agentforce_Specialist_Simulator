# Agentforce Specialist Practice Exam Simulator

Static HTML/CSS/JavaScript simulator built from the supplied **Agentforce Specialist Practice Tests** PDF.

## Included

- `index.html` - app shell and UI
- `styles.css` - responsive styling
- `app.js` - simulator logic
- `questions.js` - browser-ready 364-question bank
- `questions.json` - machine-readable copy of the same bank

## Modes

### Study Mode
- All 364 questions in source order
- Immediate answer checking
- Source explanations
- Live checked-question score
- Flags and question navigator

### Exam Mode
- 60 questions randomly sampled from the bank
- Answer options randomized per attempt
- 105-minute countdown
- 72% passing target
- Score hidden until submission
- Missed-question review after submission

The exam-mode defaults reflect the current Spring '26 English Salesforce Agentforce Specialist exam guide at the time this simulator was created. They can be changed in the `CONFIG` object at the top of `app.js`.

## Run locally

Because the site uses only static files, you can open `index.html` directly in most browsers. For the closest GitHub Pages behavior, run a local static server from this folder:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`.

## Publish with GitHub Pages

1. Create a GitHub repository.
2. Upload the files in this folder to the repository root.
3. In **Settings → Pages**, select **Deploy from a branch**.
4. Choose the `main` branch and `/ (root)`.
5. Save and wait for the Pages URL to become available.

## Source notes

The question text, answer keys, and explanations are based on the PDF supplied for this project. Only extraction artifacts such as line-break hyphenation, repeated whitespace, and broken apostrophe spacing were normalized. One source question has no explanation (bank #4), and one source question is published with only two answer options (bank #239); the simulator preserves those source anomalies rather than inventing missing material.

This is a study aid and is not an official Salesforce product.
