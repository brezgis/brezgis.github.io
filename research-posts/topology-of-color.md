---
title: Language-Specific Loop Structure in mBERT Attention Graphs
venue: Brandeis COSI 115b course project
date: 2026-05-06
draft: false
image: assets/img/research/topology-thumb.svg
hero: none
css: ../css/topology.css
links: PDF | ../assets/papers/brezgis-topology-of-color.pdf; Code | https://github.com/brezgis/ph-project
blurb: Persistent homology over mBERT attention graphs for corpus mentions of color terms in English, Spanish, and Russian, with non-color adjectives as a control. Loop structure (H1) differs by language even after controlling for tokenization and sentence length (permutation p = 0.001), equally for color and adjectives, though the difference is small, only 2–4% above the variation within a single language’s sample.
---
Unlike other continuous physical phenomena like temperature or speed, color has no system of precise measurement in the common vernacular, so languages carve it into discrete categories and draw them differently. Russian splits blue into dark *синий* and light *голубой*, and Russian speakers are faster at telling shades across that boundary apart (Winawer et al., 2007).

This project set out to test whether color is distinct between languages in a multilingual model, with the two Russian blues as the motivation. What it found is that the language itself is distinct, not the color. Non-color adjectives like *big*, *small*, *old* and *good* show the same statistically significant difference between languages as the color terms do.

Following [Kushnareva et al. (2021)](https://aclanthology.org/2021.emnlp-main.50/), whose pipeline I use as the feature extractor, each mBERT attention head over a sentence is treated as a weighted graph, and persistent homology summarizes its shape as connected components (H<sub>0</sub>) and loops (H<sub>1</sub>). The data are about 200 news sentences per color term in English, Spanish and Russian.

<figure class="tc tc-filtration" id="tc-filtration">
<div class="tc-card">
<p class="tc-title">One attention head, read as a shape</p>
<p class="tc-legend"><span><i class="tc-key blue"></i>components (H<sub>0</sub>)</span><span><i class="tc-key amber"></i>loops (H<sub>1</sub>)</span></p>
<div class="tc-plot"></div>
</div>
<figcaption>Real weights from mBERT layer 2, head 7 (counting from 0) on a corpus line, “They are blue and have a very unique look.” A token pair joins once 1 − attention falls below the threshold.</figcaption>
</figure>

## Results

On all contexts the language effect is overwhelmingly large (z = 55–80). Two controls change what it means. On contexts matched for length, the H<sub>0</sub> effect shrinks to z = 2.7–4.5 while the H<sub>1</sub> effect holds at z ≈ 33–34, and the non-color adjectives show the same pattern at the same size.

<figure class="tc tc-effect" id="tc-effect">
<p class="tc-title">Language effect, color terms vs. control adjectives</p>
<p class="tc-legend"><span><i class="tc-key blue"></i>color terms</span><span><i class="tc-key amber"></i>non-color adjectives</span></p>
<p class="tc-panel">Wasserstein distance</p>
<div class="tc-plot" data-metric="wasserstein"></div>
<p class="tc-panel">Bottleneck distance</p>
<div class="tc-plot" data-metric="bottleneck"></div>
<details class="tc-table"><summary>Show as table</summary><div class="tc-scroll">
<table><thead><tr><th>Distance</th><th>Homology</th><th>Sentences (N color / adj.)</th><th class="num">Color z</th><th class="num">Adjective z</th></tr></thead><tbody>
<tr><td>Wasserstein</td><td>H<sub>0</sub></td><td>all (680 / 720)</td><td class="num">79.7</td><td class="num">93.8</td></tr>
<tr><td>Wasserstein</td><td>H<sub>0</sub></td><td>length-matched (282 / 309)</td><td class="num">4.45 (p = 0.003)</td><td class="num">4.08 (p = 0.005)</td></tr>
<tr><td>Wasserstein</td><td>H<sub>1</sub></td><td>all (680 / 720)</td><td class="num">54.6</td><td class="num">112.2</td></tr>
<tr><td>Wasserstein</td><td>H<sub>1</sub></td><td>length-matched (282 / 309)</td><td class="num">34.1</td><td class="num">35.3</td></tr>
<tr><td>Bottleneck</td><td>H<sub>0</sub></td><td>all (680 / 720)</td><td class="num">66.7</td><td class="num">71.9</td></tr>
<tr><td>Bottleneck</td><td>H<sub>0</sub></td><td>length-matched (282 / 309)</td><td class="num">2.66 (p = 0.016)</td><td class="num">2.57 (p = 0.020)</td></tr>
<tr><td>Bottleneck</td><td>H<sub>1</sub></td><td>all (680 / 720)</td><td class="num">68.3</td><td class="num">97.8</td></tr>
<tr><td>Bottleneck</td><td>H<sub>1</sub></td><td>length-matched (282 / 309)</td><td class="num">32.8</td><td class="num">35.8</td></tr>
</tbody></table><p>Where no p is given, p &lt; 0.0001 (10,000 permutations). All pass Benjamini–Hochberg correction.</p></div></details>
</figure>

<figure class="tc tc-heads" id="tc-heads">
<p class="tc-title">Language effect in each attention head</p>
<p class="tc-sub">Wasserstein distance, color terms, length-matched sentences.</p>
<p class="tc-legend"><span><i class="tc-key dot"></i>significant after Benjamini–Hochberg correction</span></p>
<div class="tc-plot"></div>
</figure>

mBERT also splits Russian far more finely, at 1.8 wordpieces per word against 1.2–1.3 for English and Spanish. Controlling for tokenization removes the H<sub>0</sub> effect, but the H<sub>1</sub> effect survives (p = 0.001), for color and adjectives alike. It is small, though, only 2–4% above the variation within a single language's sample. The two Russian blues do not separate at all (p = 0.57–0.97).

<figure class="tc tc-tbl" id="tc-blue-table">
<table>
<thead><tr><th></th><th class="num">W H<sub>0</sub></th><th class="num">W H<sub>1</sub></th><th class="num">B H<sub>0</sub></th><th class="num">B H<sub>1</sub></th></tr></thead>
<tbody>
<tr><th scope="row">синий vs. голубой</th><td class="num">0.91</td><td class="num">0.76</td><td class="num">0.97</td><td class="num">0.57</td></tr>
<tr><th scope="row">{blue, azul, синий}</th><td class="num">0.096</td><td class="num">0.068</td><td class="num">0.146</td><td class="num tc-hit">0.044</td></tr>
<tr><th scope="row">{blue, azul, голубой}</th><td class="num">0.52</td><td class="num">0.34</td><td class="num">0.52</td><td class="num">0.98</td></tr>
</tbody></table>
<p class="tc-note"><b>Do the Russian blues separate?</b> Permutation p-values for the within-Russian split and the two blue translation triples. W = Wasserstein, B = bottleneck distance. Highlighted: p &lt; 0.05.</p>
</figure>

## Discussion

Whatever separates the languages in mBERT's attention topology, it is not color-specific. What survives the controls, a language difference in loop structure, may reflect syntax or word order, or tokenization effects finer than the summaries used here.

<script src="../js/topology.js" defer></script>
