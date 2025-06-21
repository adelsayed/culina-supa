############################ PROMPT TEMPLATE ############################
## USER PARAMETERS – EDIT THESE
COUNTRY            = Egypt            # e.g. Saudi Arabia, UAE
SECTOR             = Hospitals              # e.g. Renewable Energy, Hospitals
TIME_PERIOD_MONTHS = 12  # e.g. 12

## TASK
Identify **major** {{SECTOR}} projects that were **announced or commenced within the last {{TIME_PERIOD_MONTHS}} months** in **{{COUNTRY}}**.

## DEFINITIONS
• **Major project** = a flagship-scale development based on the norms of the selected {{SECTOR}} — e.g., for Renewable Energy: ≥100 MW or USD 500M; for Hospitals: ≥500 beds or USD 500M; for Infrastructure: national-level impact, etc.  
• **Date window** = from today back {{TIME_PERIOD_MONTHS}} months.

## REQUIREMENTS
1. **Date filter**: project announcement/start must fall within the {{TIME_PERIOD_MONTHS}}-month window.  
2. **Geography**: must be located in {{COUNTRY}}; specify city & region.  
3. **Sector fit**: must clearly match {{SECTOR}} — exclude unrelated or borderline projects.  
4. **Source quality** (ranked):
   - **Tier 1** – Government websites, official project owner sites, regulatory filings.
   - **Tier 2** – Major international outlets (e.g., Reuters, Bloomberg, WSJ), or trusted regional media (e.g., MEED, The National, Zawya).
   - **Tier 3** – Reputable industry-specific publications.
   ❌ Do NOT include content from blogs, press aggregators, AI-generated listings, or low-trust sources.
5. **Verification**: cross-verify each project with **at least one Tier 1 or Tier 2 source**.
6. **Exclusions**: exclude feasibility studies, expansions under $100M (unless sectorally significant), or projects outside the date window.

## SEARCH STRATEGY
A. Calculate `date_from = today – {{TIME_PERIOD_MONTHS}} months`, `date_to = today`.  
B. Use search phrases like:  
("announced" OR "launched" OR "approved" OR "groundbreaking" OR "contract awarded")
AND "{{SECTOR}}"
AND "{{COUNTRY}}"
AND ("{{current year}}" OR "{{last year}}")
site:gov OR site:reuters.com OR site:meed.com OR site:thenationalnews.com OR site:zawya.com
C. Capture candidates → apply all filters → keep only verified **major** projects.

## OUTPUT FORMAT
Return a Markdown table with **one row per verified project**:

| Project Name | Location (City, Region) | Investment (USD) | Announcement Date (MM/YYYY) | Status | Key Details (≤30 words) | Primary Source URL |
|--------------|-------------------------|------------------|-----------------------------|--------|-------------------------|--------------------|

## EXAMPLE
| Project Name              | Location         | Investment (USD) | Announcement Date | Status            | Key Details                                   | Primary Source URL               |
|---------------------------|------------------|------------------|-------------------|-------------------|----------------------------------------------|----------------------------------|
| Example Health MegaCenter | Abu Dhabi, UAE   | 700 M            | 06/2024           | Under construction | 600-bed facility; trauma + cancer specialty   | https://thenationalnews.com/... |

############################ END TEMPLATE ############################
