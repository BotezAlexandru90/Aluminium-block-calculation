# Precision Aluminum Block Cost Estimator

A browser-based estimator for direct manufacturing costs of an aluminum block. It calculates material cost and scrap credit, setup amortization, machining time, tooling, post-machining operations, and total part and batch cost.

## Run locally

1. Download or clone this repository.
2. Keep `Valve Block Costs Tool.html`, `app.js`, and `styles.css` in the same folder.
3. Open `Valve Block Costs Tool.html` in a modern browser.

The interface styling uses Tailwind CSS from its CDN, so an internet connection is required to load the design. The estimator itself does not require a server or build step.

## Publish with GitHub Pages

1. Push these files to a GitHub repository.
2. Open **Settings → Pages** for the repository.
3. Under **Build and deployment**, select **Deploy from a branch**.
4. Choose the branch and folder containing the files (usually `main` and `/ (root)`), then save.
5. Open the Pages URL shown in the settings. If the HTML file has a different name, rename it to `index.html` to make it the site's home page.

## Use

- Edit dimensions and material properties, machining steps, tooling, and post-processing costs. Costs are displayed in euros with three decimal places.
- Use **Save State** to store the current setup in this browser.
- Use **Export JSON** to download a setup template, or **Import JSON** to load one later.
- Use **Guide** for a brief description of the main parameter sections.

Browser-saved state is local to the browser and device. Export a JSON file to back up or transfer a configuration.

## Estimate limitations

This is a direct-cost estimate and does not include indirect costs. Confirm material properties, rates, cycle times, and supplier pricing before using the estimate for production or quoting.
