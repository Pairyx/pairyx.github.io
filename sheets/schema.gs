/**
 * GENERATED FILE — do not edit.
 * Produced by sheets/build-schema.mjs from apply/forms.js.
 * Regenerate with:  node sheets/build-schema.mjs
 *
 * Used only by setup(). Live submissions carry their own schema.
 */

var SCHEMA = {
  "creator": [
    {
      "legend": "You",
      "fields": [
        {
          "k": "display_name",
          "label": "Name or channel name",
          "type": "text"
        },
        {
          "k": "contact_email",
          "label": "Best email to reach you",
          "type": "email"
        },
        {
          "k": "location",
          "label": "Where are you based?",
          "type": "text",
          "hint": "City and country. Some brands can only work in certain markets."
        },
        {
          "k": "years_creating",
          "label": "How long have you been creating?",
          "type": "select"
        },
        {
          "k": "has_manager",
          "label": "Do you have a manager or agent?",
          "type": "radio"
        },
        {
          "k": "manager_contact",
          "label": "Who should we copy in?",
          "type": "text",
          "hint": "Only if you said yes above."
        }
      ]
    },
    {
      "legend": "Your reach",
      "fields": [
        {
          "k": "primary_platform",
          "label": "Where is most of your audience?",
          "type": "select"
        },
        {
          "k": "handles",
          "label": "Your handles or channel links",
          "type": "text",
          "hint": "All of them, comma separated."
        },
        {
          "k": "primary_followers",
          "label": "Audience size on your main platform",
          "type": "number",
          "hint": "A round number is fine."
        },
        {
          "k": "youtube_subs",
          "label": "YouTube subscribers",
          "type": "number"
        },
        {
          "k": "instagram_followers",
          "label": "Instagram followers",
          "type": "number"
        },
        {
          "k": "tiktok_followers",
          "label": "TikTok followers",
          "type": "number"
        },
        {
          "k": "newsletter_subs",
          "label": "Newsletter subscribers",
          "type": "number"
        },
        {
          "k": "other_platforms",
          "label": "Anywhere else worth knowing about?",
          "type": "text"
        }
      ]
    },
    {
      "legend": "Your content",
      "fields": [
        {
          "k": "niche_description",
          "label": "What is your content about?",
          "type": "textarea",
          "hint": "Your words, not a category label. Two or three sentences."
        },
        {
          "k": "niche_category",
          "label": "Closest category",
          "type": "select"
        },
        {
          "k": "secondary_category",
          "label": "Anything you also cover?",
          "type": "select"
        },
        {
          "k": "content_formats",
          "label": "What do you make?",
          "type": "checks"
        },
        {
          "k": "posting_frequency",
          "label": "How often do you post?",
          "type": "select"
        },
        {
          "k": "typical_length",
          "label": "Typical length of a main piece",
          "type": "text"
        },
        {
          "k": "content_pillars",
          "label": "Recurring series or formats?",
          "type": "textarea",
          "hint": "Named segments a brand could sponsor."
        },
        {
          "k": "languages",
          "label": "What language do you publish in?",
          "type": "text"
        },
        {
          "k": "production_setup",
          "label": "Who makes it?",
          "type": "select"
        }
      ]
    },
    {
      "legend": "Your audience",
      "fields": [
        {
          "k": "audience_age_primary",
          "label": "Largest age group",
          "type": "select"
        },
        {
          "k": "audience_age_secondary",
          "label": "Second largest",
          "type": "select"
        },
        {
          "k": "audience_female_pct",
          "label": "Roughly what % is female?",
          "type": "number",
          "hint": "0–100. An estimate is fine."
        },
        {
          "k": "geo_1",
          "label": "Top country",
          "type": "text"
        },
        {
          "k": "geo_1_pct",
          "label": "…roughly what % of your audience?",
          "type": "number"
        },
        {
          "k": "geo_2",
          "label": "Second country",
          "type": "text"
        },
        {
          "k": "geo_3",
          "label": "Third country",
          "type": "text"
        },
        {
          "k": "audience_description",
          "label": "Describe your audience to someone who has never seen your work",
          "type": "textarea",
          "hint": "Who are they, what do they care about, why do they trust you? This one is genuinely useful."
        }
      ]
    },
    {
      "legend": "How your content performs",
      "fields": [
        {
          "k": "avg_views",
          "label": "Average views on a recent post",
          "type": "number",
          "hint": "Last 30 days, your main format."
        },
        {
          "k": "median_views",
          "label": "Median views",
          "type": "number",
          "hint": "If you know it. More honest than an average when one video went viral."
        },
        {
          "k": "engagement_rate",
          "label": "Engagement rate (%)",
          "type": "number",
          "hint": "Likes plus comments over reach. Leave blank if you are unsure."
        },
        {
          "k": "avg_comments",
          "label": "Typical comments per post",
          "type": "number"
        },
        {
          "k": "retention_pct",
          "label": "Average view duration or retention (%)",
          "type": "number",
          "hint": "Video creators — this is a strong signal for sponsored segments."
        },
        {
          "k": "link_ctr",
          "label": "Click-through rate on links (%)",
          "type": "number",
          "hint": "Stories, description links, newsletter links."
        },
        {
          "k": "best_performing",
          "label": "What has performed best recently, and why do you think it worked?",
          "type": "textarea"
        }
      ]
    },
    {
      "legend": "Brand work you have done",
      "fields": [
        {
          "k": "done_deals_before",
          "label": "Have you worked with brands before?",
          "type": "radio"
        },
        {
          "k": "deals_last_12mo",
          "label": "How many in the last 12 months?",
          "type": "select"
        },
        {
          "k": "brands_worked_with",
          "label": "Which brands?",
          "type": "textarea",
          "hint": "Names are enough. Skip any you are under NDA about."
        },
        {
          "k": "best_deal_story",
          "label": "Which partnership went best, and why?",
          "type": "textarea"
        },
        {
          "k": "results_data",
          "label": "Any numbers you can share",
          "type": "textarea",
          "hint": "Clicks, code redemptions, conversions, ROAS — anything you have. This is what gets you a higher rate."
        },
        {
          "k": "uses_promo_codes",
          "label": "Do you use promo codes or affiliate links?",
          "type": "radio"
        },
        {
          "k": "has_media_kit",
          "label": "Do you have a media kit?",
          "type": "radio"
        },
        {
          "k": "media_kit_url",
          "label": "Link to it",
          "type": "url"
        }
      ]
    },
    {
      "legend": "Rates and terms",
      "fields": [
        {
          "k": "rate",
          "label": "Your usual range for a brand deal (USD)",
          "type": "range",
          "hint": "Low end to high end."
        },
        {
          "k": "rate_dedicated",
          "label": "Dedicated video or post",
          "type": "number"
        },
        {
          "k": "rate_integrated",
          "label": "Integrated mention or segment",
          "type": "number"
        },
        {
          "k": "rate_story",
          "label": "Story or short-form",
          "type": "number"
        },
        {
          "k": "min_deal_size",
          "label": "Smallest deal worth your time",
          "type": "number"
        },
        {
          "k": "deal_structures",
          "label": "Deal shapes you will accept",
          "type": "checks"
        },
        {
          "k": "usage_rights",
          "label": "Usage rights you will grant",
          "type": "checks"
        },
        {
          "k": "exclusivity_ok",
          "label": "Will you accept category exclusivity?",
          "type": "radio"
        },
        {
          "k": "turnaround",
          "label": "Typical turnaround once a deal is signed",
          "type": "select"
        }
      ]
    },
    {
      "legend": "What you want",
      "fields": [
        {
          "k": "categories_wanted",
          "label": "Categories you would like more of",
          "type": "checks"
        },
        {
          "k": "brand_exclusions",
          "label": "Anything you will not promote?",
          "type": "textarea",
          "hint": "Categories or specific brands. Leave blank if none."
        },
        {
          "k": "dream_brands",
          "label": "Brands you would say yes to immediately",
          "type": "textarea"
        },
        {
          "k": "requires_trial",
          "label": "Do you need to try a product before promoting it?",
          "type": "radio"
        },
        {
          "k": "creative_control",
          "label": "How much creative control do you need?",
          "type": "select"
        },
        {
          "k": "anything_else",
          "label": "Anything else we should know?",
          "type": "textarea"
        }
      ]
    }
  ],
  "brand": [
    {
      "legend": "Your company",
      "fields": [
        {
          "k": "company_name",
          "label": "Company or brand name",
          "type": "text"
        },
        {
          "k": "website",
          "label": "Website",
          "type": "url"
        },
        {
          "k": "contact_name",
          "label": "Your name",
          "type": "text"
        },
        {
          "k": "contact_role",
          "label": "Your role",
          "type": "text"
        },
        {
          "k": "contact_email",
          "label": "Best email to reach you",
          "type": "email"
        },
        {
          "k": "hq_location",
          "label": "Where are you based?",
          "type": "text"
        },
        {
          "k": "stage",
          "label": "Where is the business at?",
          "type": "select"
        }
      ]
    },
    {
      "legend": "What you sell",
      "fields": [
        {
          "k": "product_description",
          "label": "What do you sell?",
          "type": "textarea",
          "hint": "Plain language. A couple of sentences."
        },
        {
          "k": "category",
          "label": "Closest category",
          "type": "select"
        },
        {
          "k": "hero_product",
          "label": "Which product do you want promoted?",
          "type": "text"
        },
        {
          "k": "differentiator",
          "label": "Why do people buy it over the alternative?",
          "type": "textarea",
          "hint": "The honest answer, not the tagline."
        },
        {
          "k": "price_point",
          "label": "Typical price or order value (USD)",
          "type": "number",
          "hint": "Helps us judge whether a creator's audience can afford it."
        },
        {
          "k": "business_model",
          "label": "How does it sell?",
          "type": "select"
        },
        {
          "k": "proof_points",
          "label": "Any proof we can point creators at?",
          "type": "textarea",
          "hint": "Reviews, results, clinical data, awards, notable customers."
        },
        {
          "k": "can_send_product",
          "label": "Can you send product to creators?",
          "type": "radio"
        }
      ]
    },
    {
      "legend": "Who you want to reach",
      "fields": [
        {
          "k": "target_audience",
          "label": "Describe your ideal customer",
          "type": "textarea",
          "hint": "Who are they, and what makes them buy?"
        },
        {
          "k": "target_age",
          "label": "Primary age group",
          "type": "select"
        },
        {
          "k": "target_age_secondary",
          "label": "Secondary age group",
          "type": "select"
        },
        {
          "k": "target_gender",
          "label": "Any gender skew?",
          "type": "select"
        },
        {
          "k": "target_geos",
          "label": "Markets that matter",
          "type": "text",
          "hint": "Most important first."
        },
        {
          "k": "target_income",
          "label": "Rough income bracket",
          "type": "select"
        },
        {
          "k": "customer_interests",
          "label": "What else are they into?",
          "type": "textarea",
          "hint": "Adjacent interests often point at the best creators."
        },
        {
          "k": "current_channels",
          "label": "How do you acquire customers today?",
          "type": "text"
        }
      ]
    },
    {
      "legend": "The campaign",
      "fields": [
        {
          "k": "campaign_goal",
          "label": "What is this for?",
          "type": "select"
        },
        {
          "k": "primary_kpi",
          "label": "How will you judge it?",
          "type": "text",
          "hint": "The one number that decides whether this worked."
        },
        {
          "k": "timeline",
          "label": "When do you want this live?",
          "type": "text"
        },
        {
          "k": "creators_wanted",
          "label": "How many creators?",
          "type": "select"
        },
        {
          "k": "platforms_wanted",
          "label": "Which platforms?",
          "type": "checks"
        },
        {
          "k": "formats_wanted",
          "label": "What kind of content?",
          "type": "checks"
        },
        {
          "k": "needs_usage_rights",
          "label": "Will you want to run the content as paid ads?",
          "type": "radio"
        },
        {
          "k": "needs_exclusivity",
          "label": "Do you need category exclusivity?",
          "type": "radio"
        }
      ]
    },
    {
      "legend": "Budget",
      "fields": [
        {
          "k": "budget",
          "label": "Total budget for this (USD)",
          "type": "range"
        },
        {
          "k": "per_creator_budget",
          "label": "Rough budget per creator (USD)",
          "type": "number"
        },
        {
          "k": "budget_flexibility",
          "label": "How firm is that?",
          "type": "select"
        },
        {
          "k": "deal_structures",
          "label": "Deal shapes you can offer",
          "type": "checks"
        },
        {
          "k": "payment_terms",
          "label": "Payment terms you can offer",
          "type": "select"
        },
        {
          "k": "budget_recurring",
          "label": "Is this one-off or ongoing?",
          "type": "radio"
        }
      ]
    },
    {
      "legend": "What you have tried",
      "fields": [
        {
          "k": "ran_before",
          "label": "Have you run creator campaigns before?",
          "type": "radio"
        },
        {
          "k": "past_creators",
          "label": "Which creators?",
          "type": "textarea"
        },
        {
          "k": "what_worked",
          "label": "What worked?",
          "type": "textarea"
        },
        {
          "k": "what_didnt",
          "label": "What did not?",
          "type": "textarea",
          "hint": "Genuinely useful — it stops us repeating it."
        },
        {
          "k": "past_results",
          "label": "Any numbers from those campaigns?",
          "type": "textarea",
          "hint": "ROAS, CPM, conversions, whatever you tracked."
        },
        {
          "k": "why_now",
          "label": "Why are you looking now?",
          "type": "textarea"
        }
      ]
    },
    {
      "legend": "Fit and guardrails",
      "fields": [
        {
          "k": "brand_values",
          "label": "What does your brand stand for?",
          "type": "textarea",
          "hint": "The tone a creator would need to match."
        },
        {
          "k": "creative_guidelines",
          "label": "How prescriptive are you about the content?",
          "type": "select"
        },
        {
          "k": "approval_process",
          "label": "Who signs off, and how long does it take?",
          "type": "text"
        },
        {
          "k": "competitors_avoid",
          "label": "Competitors a creator must not have worked with",
          "type": "textarea"
        },
        {
          "k": "creator_exclusions",
          "label": "Creator types or content you want to avoid",
          "type": "textarea"
        },
        {
          "k": "dealbreakers",
          "label": "Anything that is an automatic no?",
          "type": "textarea"
        },
        {
          "k": "anything_else",
          "label": "Anything else we should know?",
          "type": "textarea"
        }
      ]
    }
  ]
}
