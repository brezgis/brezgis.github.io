---
title: Multilingual Metaphor Detection on the LCC Datasets
venue: Brandeis COSI 114a course project
date: 2025-12-19
draft: false
image: assets/img/research/metaphor-thumb.svg
hero: none
css: ../css/metaphor.css
links: PDF | ../assets/papers/brezgis-detecting-metaphor.pdf; Code | https://github.com/brezgis/metaphor-classifier-cosi114a; Model | https://huggingface.co/brezgis/lcc-metaphor-mdeberta
blurb: Metaphor detection on the LCC datasets in English, Spanish, Russian and Farsi. Each example is a source/target word pair in a sentence. A fine-tuned mDeBERTa, trained on all four languages, reaches F1 0.83 (English), 0.74 (Spanish), 0.86 (Russian) and 0.68 (Farsi).
---


A sentence like "the foundation of our government is strong" is metaphorical because it talks about one thing in terms of another. This project fine-tunes mDeBERTa on the [LCC Metaphor Dataset](https://aclanthology.org/L16-1668/) (Mohler et al., 2016). In the data, annotators score how metaphorical a source/target word pair is within a sentence. In "the **War** on **Poverty**," for example, *War* is the source and *Poverty* the target. A pair counts as metaphorical if its mean score is at least 2 on the dataset's 0–3 scale.

<figure class="mx mx-examples" id="mx-examples">
<p class="mx-ex is-metaphor">Real enjoyment is at the <span class="mx-ex-keep"><span class="mx-ex-w" data-role="source">heart<small>source</small></span> of <span class="mx-ex-w" data-role="target">faith<small>target</small></span>. <span class="mx-ex-label">metaphor</span></span></p>
<p class="mx-ex is-literal">I work harder, get paid more, and <span class="mx-ex-keep"><span class="mx-ex-w" data-role="source">pay<small>source</small></span> more <span class="mx-ex-w" data-role="target">taxes<small>target</small></span>. <span class="mx-ex-label">literal</span></span></p>
</figure>

<!-- Animated pair demo, hidden for now (2026-10-14):
<div class="mx mx-demo" id="mx-demo">
<p><em>Democracy is fun ... democracy with a jambox is better.</em> The pair <em>fun → democracy</em> is a metaphor; <em>jambox → democracy</em> is literal.</p>
</div>
-->

<!-- Approach section, hidden for now (2026-10-14):

## Approach

Some sentences hold several pairs with opposite labels, as in the examples above, so a model has to know which pair it is judging. The final model marks the pair right in the text and fine-tunes mDeBERTa-v3, a multilingual encoder, on all four LCC languages at once (English, Spanish, Russian and Farsi), class-weighted, with the epoch chosen on the development set and three training seeds.

<figure class="mx mx-pipe" id="mx-pipe">
<div class="mx-pipe-row">
<div class="mx-node"><span class="mx-node-label">marked pair</span><span class="mx-chip">the [[ tax ]] &lt;&lt; burden &gt;&gt; is lower</span></div>
<div class="mx-link l1"><i></i></div>
<div class="mx-node"><span class="mx-node-label">mDeBERTa</span><span class="mx-layers"><i></i><i></i><i></i><i></i><i></i><i></i></span></div>
<div class="mx-link l2"><i></i></div>
<div class="mx-node"><span class="mx-node-label">classifier</span><span class="mx-headbox"></span></div>
<div class="mx-link l3"><i></i></div>
<div class="mx-node"><span class="mx-node-label">label</span><span class="mx-verdict show is-metaphor"><i></i><span>metaphor</span></span></div>
</div>
<figcaption>The final model reads the pair marked right in the text: &lt;&lt; source &gt;&gt; and [[ target ]].</figcaption>
</figure>

-->

## Results

On the held-out English test set (866 pairs, split by document so that no test document is seen in training), the model reaches F1 0.83, with precision 0.78 and recall 0.89, averaged over three seeds.

<figure class="mx mx-tbl" id="mx-cm">
<table>
<thead><tr><th></th><th class="num">Pred Literal</th><th class="num">Pred Metaphor</th></tr></thead>
<tbody>
<tr><th scope="row">True Literal</th><td class="num">488 (56.4%)</td><td class="num">73 (8.4%)</td></tr>
<tr><th scope="row">True Metaphor</th><td class="num">39 (4.5%)</td><td class="num">266 (30.7%)</td></tr>
</tbody></table>
<p class="mx-note"><b>Table 1.</b> Confusion matrix for the joint fine-tuned model on the English test set (seed 0).</p>
</figure>

It leans toward labeling pairs as metaphorical. Most of its errors are literal pairs labeled as metaphors, and recall is higher than precision in every language.

<figure class="mx mx-tbl" id="mx-metrics">
<table>
<thead><tr><th></th><th class="num">Precision</th><th class="num">Recall</th><th class="num">F<sub>1</sub></th><th class="num">Acc.</th><th class="num"><i>N</i></th></tr></thead>
<tbody>
<tr><th scope="row">English</th><td class="num">.776<span class="ltx-sd">±.007</span></td><td class="num">.885<span class="ltx-sd">±.012</span></td><td class="num">.827<span class="ltx-sd">±.002</span></td><td class="num">.870<span class="ltx-sd">±.001</span></td><td class="num">866</td></tr>
<tr><th scope="row">Spanish</th><td class="num">.694<span class="ltx-sd">±.016</span></td><td class="num">.786<span class="ltx-sd">±.014</span></td><td class="num">.737<span class="ltx-sd">±.003</span></td><td class="num">.855<span class="ltx-sd">±.004</span></td><td class="num">4,284</td></tr>
<tr><th scope="row">Russian</th><td class="num">.833<span class="ltx-sd">±.002</span></td><td class="num">.883<span class="ltx-sd">±.008</span></td><td class="num">.857<span class="ltx-sd">±.003</span></td><td class="num">.889<span class="ltx-sd">±.002</span></td><td class="num">2,199</td></tr>
<tr><th scope="row">Farsi</th><td class="num">.618<span class="ltx-sd">±.003</span></td><td class="num">.760<span class="ltx-sd">±.010</span></td><td class="num">.682<span class="ltx-sd">±.003</span></td><td class="num">.765<span class="ltx-sd">±.001</span></td><td class="num">2,652</td></tr>
</tbody></table>
<p class="mx-note"><b>Table 2.</b> Test results of the joint fine-tuned model, as mean ± standard deviation (population) over three seeds. Metaphor is the positive class.</p>
</figure>

Scores follow how much the human annotators agreed with each other (Cohen's κ 0.69 in Russian, 0.51 in English, 0.48 in Spanish and only 0.12 in Farsi).

<!-- Test F1 by language chart, hidden for now (2026-10-14):
<figure class="mx mx-chart" id="mx-langs">
<p class="mx-chart-title">Test F1 by language</p>
<p class="mx-legend"><span><i class="mx-key model"></i>fine-tuned model</span><span><i class="mx-key human"></i>one annotator vs. another</span></p>
<div class="mx-plot"></div>
<details class="mx-table"><summary>Show as table</summary>
<table><thead><tr><th>Language</th><th class="num">Model F1</th><th class="num">Annotator F1</th><th class="num">Cohen’s κ</th></tr></thead><tbody>
<tr><td>English</td><td class="num">0.83</td><td class="num">0.66</td><td class="num">0.51</td></tr>
<tr><td>Spanish</td><td class="num">0.74</td><td class="num">0.60</td><td class="num">0.48</td></tr>
<tr><td>Russian</td><td class="num">0.86</td><td class="num">0.82</td><td class="num">0.69</td></tr>
<tr><td>Farsi</td><td class="num">0.68</td><td class="num">0.39</td><td class="num">0.12</td></tr>
</tbody></table></details>
</figure>
-->

## Model comparison

Table 3 compares models on the English test set, from a sentence-level baseline to the fine-tuned multilingual model.

The bag-of-words baseline scores F1 0.59. It represents the whole sentence, so it cannot tell which two words are being judged, and the signal from the pair is diluted by everything else in the sentence.

<!-- Model comparison chart, replaced by the paper's table (2026-10-14):
<figure class="mx mx-chart" id="mx-climb">
<p class="mx-chart-title">English test F1: what each ingredient adds</p>
<p class="mx-legend"><span><i class="mx-key model"></i>model</span><span><i class="mx-key ref"></i>one annotator scored against another (0.66)</span></p>
<div class="mx-plot"></div>
<details class="mx-table"><summary>Show as table</summary>
<table><thead><tr><th>Model</th><th class="num">Test F1</th><th class="num">95% CI</th></tr></thead><tbody>
<tr><td>Sentence-level baseline: BoW + frozen BERT [CLS]</td><td class="num">0.51</td><td class="num">0.46–0.56</td></tr>
<tr><td>Handcrafted source/target features</td><td class="num">0.72</td><td class="num">0.67–0.76</td></tr>
<tr><td>Frozen mDeBERTa + MLP, 6× more training data</td><td class="num">0.81</td><td class="num">0.78–0.84</td></tr>
<tr><td>Fine-tuned mDeBERTa, all four languages</td><td class="num">0.83</td><td class="num">≈0.79–0.86</td></tr>
<tr><td><em>One annotator vs. another</em></td><td class="num">0.66</td><td class="num"></td></tr>
</tbody></table></details>
</figure>
-->

<figure class="mx mx-tbl" id="mx-climb-table">
<table>
<thead><tr><th>Model</th><th>Train</th><th class="num">F<sub>1</sub></th><th class="num">95% CI</th></tr></thead>
<tbody>
<tr><th scope="row">Sentence BoW + length, balanced</th><td>small</td><td class="num">.588</td><td class="num">.544–.631</td></tr>
<tr><th scope="row">All handcrafted, LR</th><td>small</td><td class="num">.717</td><td class="num">.674–.756</td></tr>
<tr><th scope="row">Frozen mDeBERTa spans, LR</th><td>small</td><td class="num">.772</td><td class="num">.734–.809</td></tr>
<tr><th scope="row">Frozen mDeBERTa spans, LR</th><td>large</td><td class="num">.809</td><td class="num">.775–.840</td></tr>
<tr><th scope="row">Frozen mDeBERTa spans, MLP</th><td>large</td><td class="num">.812</td><td class="num">.778–.844</td></tr>
<tr><th scope="row">Fine-tuned, English only</th><td>large</td><td class="num">.833</td><td class="num">.800–.862</td></tr>
<tr><th scope="row">Fine-tuned, joint (3 seeds)</th><td>large×4</td><td class="num">.827</td><td class="num">≈.79–.86</td></tr>
<tr class="mx-tbl-ref"><th scope="row"><em>Annotator vs. annotator</em></th><td></td><td class="num"><em>.66</em></td><td class="num"></td></tr>
</tbody></table>
<p class="mx-note"><b>Table 3.</b> English test F1 (866 pairs). “Small” and “large” are the English training bundles.</p>
</figure>

Handcrafted features of the source and target words raise F1 to 0.72, and frozen mDeBERTa vectors of the two words raise it to 0.77 on the same training data. Training on the large English bundle, with about six times as many pairs, adds roughly 0.04 (0.81 with logistic regression or an MLP). Fine-tuning adds another 0.02, reaching 0.833 when trained on English alone and 0.827 when trained jointly on all four languages. The confidence intervals of the best frozen model and the fine-tuned models overlap, so differences of that size on 866 test pairs are not conclusive.

Nonlinear classifiers improved little over logistic regression on the same features. Theory-driven features behaved as expected (very concrete source words are metaphors 50% of the time, versus 21% for very abstract ones), but added little on top of the encoder.

<script src="../js/metaphor.js" defer></script>
