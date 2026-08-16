# KinLore 

## Try it out at - https://kin-lore-insights.lovable.app

## A Family legacy journal that prioritize Privacy that passively extracts longitudinal cognitive biomarkers leveraging deterministic math and secure LLM inference 

# PROBLEM 
## The existing Clinical applications used for diagnosis of health issues like Alzheimer's are intimidating, that makes the users feel unsure and unsafe regarding their privacy leading to patients or elderly abandoning them. The mere sniff or whisper of someone using this app to identify if there is chance of such disease happening in near future is treated like a taboo. Even with advancements in Artificial Intelligence and their Large language models there is always a looming risk and threat that LLMs might hallucinate leading to incorrect diagnosis or recommendations from AI.

# SOLUTION
## I have built KinLore , a Trojan Horse application that has a warm, simple and easy to operate daily journal that runs rigorous computational linguistics in the background to track cognitive changes or shifts over a certain period of time.

# Tech Stack

##

KinLore tech stack

Frontend - React 19 + TypeScript, TanStack Start v1 (file-based routing, SSR), Vite 7
Styling - Tailwind CSS v4 (src/styles.css theme tokens), shadcn/ui (new-york), Lucide icons, warm-parchment palette
Data/state - TanStack Query, TanStack Router loaders
Charts -  Recharts (line trends + radar "Cognitive Footprint")
Backend - Lovable Cloud (managed Postgres + auth) via @supabase/supabase-js, RLS on every table
Server logic: TanStack createServerFn server functions (analysis, share-code create/revoke, public redemption) running on the Cloudflare Workers edge runtime — no Supabase edge functions
Auth - email magic link, _authenticated route gate + bearer-token function middleware
AI - Featherless API (meta-llama/Meta-Llama-3.1-8B-Instruct, tool-calling) for idea density / semantic repetition; Lovable AI Gateway judge exists server-side but is hidden from UI
Deterministic analysis - custom TS in src/lib/text-metrics.ts (Brunét's Index, sentence stats), Web Speech API for dictation + WPM
Tooling - Bun, ESLint, Prettier, TypeScript path aliases


# Diagram

<img width="839" height="747" alt="image" src="https://github.com/user-attachments/assets/5a527ea0-25b5-459f-99b0-069e3eecbd55" />


# How it works (The core Metrics)

A. Semantic Extraction process - KinLore app uses a corpus linguistics formula which is called The Brunét's Index ($W = N^{V^{-0.165}}$) that is used to measure vocabulary richness, which ensures the score isn't biased by how long or short the journal entry is.

B. Acoustic Speech Tempo method - When the users use the dictation feature the browser passively measures their Words Per Minute (WPM) to capture physical psychomotor pacing which contributes to the purpose of this project.

C. Clinical SBAR Handoff Method used - In KinLore app the 7-day averages are compiled into a standard medical format  like Situation, Background, Assessment, Recommendation so that the caregivers have actionable data to show a neurologist.

# Zero-Data Retention(Data Privacy)

##  The application uses absolute data of the patients 

Inside the KinLore application the raw journal text is processed in the server's memory just long enough so as to run the math, and then it is instantly and permanently destroyed, The database only ever saves computed integers.

# Citations and Disclaimer 

## Citation as copied 

Brunét, É. (1978). Le Vocabulaire de Jean Giraudoux: Structure et Évolution. Slatkine. The index comes out of quantitative corpus stylometry, where length-stable measures of vocabulary are used to compare texts across time. Later computational linguistic work has examined vocabulary contraction in longitudinal writing samples as one descriptive signal among many. That literature is research context for why this measure is interesting to track — it is not a threshold, a screening instrument, or a diagnosis.

## Disclaimer

KinLore is a hackathon proof of concept and self reflection tool that uses mathematical concepts to evaluate the speech and thinking and is strictly not a medical tool that must be used for Diagnosis.

