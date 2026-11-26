+++
title = "Developers Wilding: My First Hackathon Since College"
date = 2026-11-26
description = "Mozilla's Developers Wilding hackathon was built around Otari, their LLM gateway. I wired open-weight models into my Helix fork through it, and an issue I filed along the way got fixed upstream."

[taxonomies]
tags = ["Rust", "Helix", "Otari", "Hackathon", "Open Weights", "Postmortem"]

[extra]
id = 19
thumbnail = "https://cdn.ujjwalvivek.com/posts/media/log_0012_thumb.webp"
+++

<!-- markdownlint-disable MD013 MD033-->

{% <note title="The short version"> %}
Mozilla ran an online hackathon called Developers Wilding around Otari, their LLM gateway. I took helide-rs, my fork of the Helix editor, and added three commands that talk to open-weight models through Otari. An issue I filed while building it ended up fixed in Otari itself.
{% </note> %}

The last time I sat through a hackathon was during my bachelor's. When Mozilla announced Developers Wilding for MozFest 2026, I signed up before I knew what I'd build, because it had been that long. When I signed up, my project was still "in decision".

You had to build something on [Otari](https://otari.ai), Mozilla.ai's gateway for LLM calls, using open-weight models, and record a 3 to 5 minute demo with your own screen and your own voice, no AI in the video. The rubric looked like this:

| Part of the rubric | Points |
| ------------------ | ------ |
| Open-weight models: 20 for one used well, 10 more for two in different roles | 30 |
| Otari features, 10 each: routing and fallbacks, multiple models, web search or fetch, code execution, guardrails, budgets, MCP, per-user budgets | up to 60 |
| The demo video | 10 |

## Picking the project

I had three candidates: nib, echohub and helide. A "chat with my portfolio" box on echohub would have ticked every feature, but judges would see plenty of those. Autocomplete in an editor was the obvious idea and I dropped it quickly, since it fires on every pause in typing and it's one model making one call, so there is nothing to route or guard.

**helide** fit best. It's my fork of Helix with a file tree, a git panel, terminals and agent panes built in. AI in a terminal editor, through a gateway that lets you swap models without rebuilding, is a real use to me till date, and not a demo.

I left out MCP and per-user budgets. MCP needs a server that Otari's gateway can reach over the internet, and helide's runs on my machine. Per-user budgets don't mean much for an editor with one user. The other six features fit without bending anything.

## What helide does with Otari

{{ <embed src="https://www.youtube.com/embed/mu9KjosNvIY" title="helide x Otari" cover="youtube" caption="The submission video: secrets masked, a parallel rewrite, the guardrail, the sandbox catching a bug, a forced fallback and the budget cut-off." ratio="16/9" /> }}

It's three commands, with no panel or chat view:

| Command | What it does | Otari routing policy |
| ------- | ------------ | -------------------- |
| `:rewrite <instruction>` | Rewrites every selection in parallel, in place, as one undo step | `helide-fast`: DeepSeek V4.1 Flash, falling back to Ministral 3 8B |
| `:ask <question>` | Answers about the selection in a popup that streams in, with web search, and runs the code in Otari's sandbox when the file is Python | `helide-deep`: Qwen3.5-397B, falling back to GLM-5.2 |
| `m` in the git panel | Writes a commit message from the staged diff | `helide-fast` |

helide only ever asks for `helide-fast` or `helide-deep`. Which model sits behind each name is set in Otari's dashboard, so I could change models without rebuilding the editor. Otari sends back which model answered and whether it fell back in two response headers, and the status line shows both along with the cost of the call.

{% <warning title="Nothing secret leaves the editor"> %}
Before any request goes out, helide replaces values from `.env` and key files, and well-known token shapes (AWS, GitHub, Stripe, private keys, JWTs), with `[REDACTED]`. `:rewrite` refuses to send a selection that holds one, and the commit message names staged `.env` files without their contents. The same rules mask those values on screen. Otari also runs the Lakera guardrail, which blocks a request with personal data before it reaches any model.
{% </warning> %}

There is no new crate for any of this. Helix has no HTTP client, and it already runs external programs for `|` and `:sh`, so helide calls Otari through `curl` with the key passed on standard input. The Otari client module is a handful of lines.

## The numbers

From the nine calls recorded for the submission, with Otari's own request ids:

| Call | Model | Cost |
| ---- | ----- | ---- |
| `:rewrite fix the spelling`, three comments at once | DeepSeek V4.1 Flash | about $0.00002 each |
| `:ask` for a more idiomatic version, with docs linked | Qwen3.5-397B | $0.0129 |
| `:ask` to run a Python `median` and check it | Qwen3.5-397B | $0.0243 |

Otari's own overhead was about 0.2 s per call. The slow answers were slow because the model had a lot to say.

My favourite was the Python one. The `median` function returned 3 for `[1, 2, 3, 4]`, and instead of guessing, Qwen ran it in the sandbox, saw the wrong answer, fixed it and linked `statistics.median`.

## Where I got stuck

With Lakera's default policy, the guardrail flagged plain requests like "fix the spelling in these comments" at a score of about 0.4. For a while it was the only reason requests failed, and calling DeepSeek directly would have hidden that. What fixed it was a narrower Lakera policy that only looks for personal data. It took me too long to see the policy was the problem and not my prompts.

Otari's code execution only runs Python, and nothing told the model that. When I asked it to run a Rust function, it came back with believable output for code that never ran. So helide only turns the sandbox on for Python files.

A few errors gave me no reason at all. A chat request to an embedding model came back as "No model could serve the request (2 attempts)", and Kimi K2.6 returned an empty answer where other models handled the same prompt fine.

All of it, the good and the bad, is in my [feedback file](https://github.com/ujjwalvivek/helide-rs/blob/helide-rs-mozilla/docs/otari/FEEDBACK.md).

## The issue that got fixed

I filed the sandbox problem as [mozilla-ai/otari#2798](https://github.com/mozilla-ai/otari/issues/2798), and it was closed as fixed in Otari itself. The code execution tool now lists the languages it runs and turns the rest away. Its description also tells the model to say when it couldn't run the code.

The maintainer tested it with "Run this Rust program and tell me exactly what it prints". Claude Opus, Claude Sonnet and GPT-5.5 now say the Rust never ran in six out of six tries, where GPT-5.5 managed zero out of six before the change. Some smaller models still don't say it, and that part is up to the model, not the gateway.

That fix meant more to me than anything else from the hackathon.

## After

I didn't place. I got to build to a deadline again, and I came out of it with a branch of my editor that talks to four open-weight models.

- The code: [helide-rs on the helide-rs-mozilla branch](https://github.com/ujjwalvivek/helide-rs/tree/helide-rs-mozilla), with the submitted version tagged `otari-submission`
- How it uses Otari, with all nine calls: [docs/otari](https://github.com/ujjwalvivek/helide-rs/blob/helide-rs-mozilla/docs/otari/README.md)
- helide itself: [helide.ujjwalvivek.com](https://helide.ujjwalvivek.com)
