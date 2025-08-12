# PlayWright End-to-End Testing

## How to run

### Run e2e tests - US production sites are default

#### Data

All JSON data files located in [tests/data](../data/)

- Site URLs
- Content URLs for testing
- adConfig
- Ensighten URL values
- jamData (for auto sites only)
- OneTrust Domain ID
- Facebook ID
- Google Analytics Dimension for each content type supplied

### Usage:
Available Arguments and possible values are below. If the `site` argument is not supplied, the test will loop through all sites provided in the data.

## Arguments and Possible Values

| **Argument**  | **Description**                        | **Possible Values**                                      | **Default**   |
|--------------|------------------------------------|--------------------------------------------------|--------------|
| `server`     | Target environment                | `production` \| `stage` \| `feature`            | `production` |
| `locale`     | Only the sites in these locales. Choose `all` to run on all locales | `us` \| `uk` \| `es` \| `it` \| `nl` \| `cn` \| `jp` \| `tw` \| `all` | `us` |
| `site`       | List of the websites to test on   | Check sitelist                                  | All sites    |
| `pr`         | AdsAndAnalytics Pull Request number | e.g., `1801`. This will take one of the AdsAndAnalytics pull requests | `None` |
| `pathVal`    | Specific path value               | Alphanumeric (e.g., `a63459255`)                | `None` |
| `frePR`      | fre Pull Request number           | e.g., `11793`                                   | `None` |
| `commit` | PR Commit - use `latest` for most recent | e.g., `8174c4c28a4b8197774f580e6e62ab0f540de39c` | `latest` |




- All Locales:

  - `locale="all" server="production" npm run e2e-pw:ensighten`

- US Sites
  - `npm run e2e-pw:ensighten`
- US Sites w/ specific site
  - `site="runnersworld.com" locale="us" server="production" npm run e2e-pw:ensighten`
- US Sites w/ specific site w/ specific pr w/ `latest` commit hash

  - `site="runnersworld.com" locale="us" server="production" pr="551" commit="latest" npm run e2e-pw:ensighten`

- US Sites w/ specific site w/ specific pr w/ specific commit hash

  - `site="runnersworld.com" locale="us" server="production" pr="551" commit="582721b" npm run e2e-pw:ensighten`

- US Sites w/ specific site w/ specific path

  - `site="runnersworld.com" locale="us" server="production" pathVal="a30680234" npm run e2e-pw:ensighten`

- US Sites w/ specific set of sites (value should be space delimited)

  - `site="runnersworld.com cosmopolitan.com womansday.com" locale="us" server="production" npm run e2e-pw:ensighten`

- US Sites w/ specific set of sites (value should be space delimited) w/ specific pr w/ `latest` commit hash

  - `site="runnersworld.com cosmopolitan.com womansday.com" locale="us" server="production" pr="551" commit="latest" npm run e2e-pw:ensighten`

- US Sites w/ specific set of sites (value should be space delimited) w/ specific pr w/ specific commit hash

  - `site="runnersworld.com cosmopolitan.com womansday.com" locale="us" server="production" pr="551" commit="582721b" npm run e2e-pw:ensighten`

- US Sites w/ specific PR on Next FRE

  - `locale="us" server="feature" frePR="551" npm run e2e-pw:ensighten`

- US Sites w/ specific PR w/ `latest` on Next FRE

  - `locale="us" server="feature" frePR="latest" npm run e2e-pw:ensighten`

- UK Sites

  - `locale="uk" server="production" npm run e2e-pw:ensighten`

- UK Sites w/ specific pr w/ `latest` commit hash

  - `locale="uk" server="production" pr="551" commit="latest" npm run e2e-pw:ensighten`

- UK Sites w/ specific pr w/ specific commit hash

  - `locale="uk" server="production" pr="551" commit="fb3958a" npm run e2e-pw:ensighten`

- UK Sites w/ specific PR on Next FRE

  - `locale="uk" server="feature" frePR="551" npm run e2e-pw:ensighten`

- UK Sites w/ specific PR w/ `latest` on Next FRE

  - `locale="uk" server="feature" frePR="latest" npm run e2e-pw:ensighten`

- IT Sites

  - `locale="it" server="production" npm run e2e-pw:ensighten`

- IT Sites w/ specific pr w/ `latest` commit hash

  - `locale="it" server="production" pr="551" commit="latest" npm run e2e-pw:ensighten`

- IT Sites w/ specific pr w/ specific commit hash

  - `locale="it" server="production" pr="551" commit="fb3958a" npm run e2e-pw:ensighten`

- IT Sites w/ specific PR on Next FRE
  - `locale="it" server="feature" frePR="551" npm run e2e-pw:ensighten`
- IT Sites w/ specific PR w/ `latest` on Next FRE

  - `locale="it" server="feature" frePR="latest" npm run e2e-pw:ensighten`


#### Run e2e tests - in parallel mode

Setting `3 workers` as a default value.

- `workers="3" server="production" locale="us" npm run e2e-pw:ensighten`

#### Available Test Suites

tests validate against the data provided in the specific JSON files [tests/data](../data/)

- **e2e-pw:adConfig** `npm run e2e-pw:adConfig`

  - _adConfig Verification_
    - Should load MOAPT bundle script
    - Should have `window.SELF_HOSTED_ADS = true`
    - Should have `HRST.adConfig` object
    - Should match `HRST.adConfig` object
    - Should have `window.gptLayer` object
    - Should fire the event `adScriptsDone`

- **e2e-pw:adRequest** `npm run e2e-pw:adRequest`

  - should include the correct ad IDs in Next RE/HDM's ad flow's IMM request's KVPs
  - should include the correct ad IDs in the Next RE/HDM ad flow for lazily-loaded leaderboard ads
  - should include the correct ad IDs in the Next RE/HDM ad flow for lazily-loaded right-rail ads
  - should include the correct slots in Next RE/autos ad flow's preliminary ad requests' KVPs
  - should include the correct ad IDs in Legacy/HDM's ad flow's IMM request's KVPs

- **e2e-pw:ensighten** `npm run e2e-pw:ensighten`

  - Should load Ensighten bootstrap script and check selfhostedads=on
  - Should match Ensighten bootstrap value

- **e2e-pw:chicoryAd** `npm run e2e-pw:chicoryAd`

  - _Chicory ad Tests for us sites._
    - Should load chicoryapp script.
    - Verify that "article.template" should be recipe.
    - Verify that Chicory ad should exist.
    - Verify that Chicory button should be visible.
    - Verify that if JAM fired on the page, chicoryapp script should not be loaded.
    - Verify that if JAM fired on the page, Chicory ad should not exist.
    - Verify that if JAM fired on the page, Chicory Button should not exist.
    - Verify that if the page is sponsored, Chicory ad should not be loaded.
  - _Chicory ad Tests for other locales._
    - Verify that Chicoryapp script should not be loaded.
    - Verify that "article.template" should be recipe.
    - Verify that Chicory ad should not exist.
    - Verify that Chicory Button should not exist.

- **e2e-pw:siteqa** `proxy="United States, Italy" npm run e2e-pw:siteqa`
  - The proxy parameter is optional, if it is not passed, the code won't use any proxies
  - Use `,` to list the countries (e.g. `France,United Kingdom` or `Italy, France`), extra spaces will be removed
    - For now we have selected `Germany, United States,	Italy, Japan` for our proxies and have an extra proxy left undefined
    - If we pass a list of countries from this list, the code will all work properly
    - If we pass a list of counties that has only one country that isn't from the list, the code will take the extra ip and use it
    - If we pass a list of counties that has more than one country that isn't from this list, the code will throw an error
  - _Site QA Suite._
    - Should load Google Publisher Tags (gpt.js) script.
    - Should load Ensighten script and check PageID to contain selfhostedads=on.
    - Should be recording a GA pageview to propertyID.
    - Should be recording a GA pageview custom dimenions.
    - Should be recording a GA event to propertyID.
    - Should be recording a GA4 page_view propertyID.
    - Should be recording a GA4 custom event to propertyID.
    - Should be recording a GA4 page_view to custom dimensions.
    - Should load Permutive library script with workspaceId.
    - Should load Permutive identify script with apiKey.
    - Should define Permutive localstorage.\_pdfps.
    - Should load Comscore with correct ID param.
    - Should load Facebook with correct ID.
    - Should load Quantcast script.
    - Should load Dynata (researchnow) with correct ID param.
    - Should load ActionIQ script.
    - Should MOAPT bundle files contain an ActionIQ one: "moapt-action-iq-analytics.js".
    - Should aiq "window.HRST.adConfig.modules.actionIQ" values containing the brand you are currently on.
    - Should load all configured Prebid header bidders.
    - Should load Prebid script.
    - Prebid script version matches code served.
    - Verify Prebid passes the expected values.
    - Should load Prebid Index Exchange script.
    - Verify Prebid Index Exchange passes the expected values.
    - Should load Prebid Magnite/Rubicon script.
    - Verify Prebid Magnite/Rubicon passes the expected values.
    - Should load Prebid Teads script.
    - Verify Prebid Teads passes the expected values.
    - Should load Prebid TripleLift script.
    - Verify Prebid TripleLift passes the expected values.
    - Should load Prebid TheTradeDesk script.
    - Verify Prebid TheTradeDesk passes the expected values.
    - Should load Prebid Criteo script.
    - Verify Prebid Criteo passes the expected values.
    - Should load Prebid Pubmatic script.
    - Verify Prebid Pubmatic passes the expected values.
    - Should load Prebid Rise script.
    - Verify Prebid Rise passes the expected values.
    - Should load Amazon A9 bidders script.
    - Verify Amazon A9 bidders pass the expected values.
    - Verify Prebid Kargo passes the expected values.

  - _LIFT traffic (US only)._
    - Should make ad request with .arb ad unit.
    - Should have gptLayer.isMgu = true.
    - Should set "gpt_utm" cookie with campaign=arb_test.

- **e2e-pw:analyticsGA4** `npm run e2e-pw:analyticsGA4`

  - _Google Analytics page_view/Custom Dimensions Tests_
    - Should be recording to GA4 ga4PropertyID.
    - Should make a GA4 page_view request.
    - Validates all Custom Dimensions & Metrics & Users properties
    - Requires all dimensions & metrics & Users properties to be added to the data files.
  - Currently available on
    - US sites.
    - UK sites.
    - NL sites.
    - IT sites.
    - ES sites.
    - JP sites.
    - TW sites.
    - CN sites.

- **e2e-pw:onetrust** `proxy="Germany" npm run e2e-pw:onetrust`
  - The proxy parameter is optional, if it is not passed, the code won't use any proxies and the tests will run as they used to
  - Use `,` to list the countries (e.g. `France,United Kingdom` or `Italy, France`), extra spaces will be removed
    - For now we have selected `Germany, United States,	Italy, Japan` for our proxies and have an extra proxy left undefined
    - If we pass a list of countries from this list, the code will all work properly
    - If we pass a list of counties that has only one country that isn't from the list, the code will take the extra ip and use it
    - If we pass a list of counties that has more than one country that isn't from this list, the code will throw an error
  - Update the  `tests/e2e/playwright/.env` file with your GeoEdge credentials - See [documentation](https://hearstpm.sharepoint.com/:fl:/r/contentstorage/CSP_fe5cfdc2-0092-4f8d-8f7a-22b69d48fe7c/Document%20Library/LoopAppData/GeoEdge%20Geo-Proxy%20Instructions.loop?d=wc785df53f71147ac950e500439c78847&csf=1&web=1&e=YEDf7E&nav=cz0lMkZjb250ZW50c3RvcmFnZSUyRkNTUF9mZTVjZmRjMi0wMDkyLTRmOGQtOGY3YS0yMmI2OWQ0OGZlN2MmZD1iJTIxd3YxY19wSUFqVS1QZWlLMm5Vai1mRl83MlluTDVyeENtS1JXVjhRdlZybjJDcUFpT1kzUFE3QWZ6WWU2UU1JaSZmPTAxTEZPUjRGQ1QzNkM0T0VQWFZSRFpLRFNRQVE0NFBDQ0gmYz0lMkYmYT1Mb29wQXBwJnA9JTQwZmx1aWR4JTJGbG9vcC1wYWdlLWNvbnRhaW5lciZ4PSU3QiUyMnclMjIlM0ElMjJUMFJUVUh4b1pXRnljM1J3YlM1emFHRnlaWEJ2YVc1MExtTnZiWHhpSVhkMk1XTmZjRWxCYWxVdFVHVnBTekp1VldvdFprWmZOekpaYmt3MWNuaERiVXRTVjFZNFVYWldjbTR5UTNGQmFVOVpNMUJSTjBGbWVsbGxObEZOU1dsOE1ERk1SazlTTkVaSFVsbzFNa3hGTkVjM00xWkNURk5GTWxoT1dEVkZSMEZMTlElM0QlM0QlMjIlMkMlMjJpJTIyJTNBJTIyMDVmZGEwNjUtNDhlMS00ZTU3LTljM2YtMmU3M2QyNWE3ODdjJTIyJTdE)
    - GEO_PROXY_USERNAME = *****
    - GEO_PROXY_PASSWORD = *****
  - _OneTrust Tag Tests_
    - Should load OneTrust SDK script w/ domain ID
    - Should have OptanonConsent cookie
    - Should have OptanonAlertBoxClosed cookie
    - Should have logo in initial OneTrust modal
    - Should show OneTrust Preference Center modal appears when Cookie Choices is clicked
    - Should load OneTrust JSON script, accept consent, and CMP_CONSENT = true
    - Should load OneTrust JSON script, decline consent, and CMP_WITHDRAWN = true
    - Should load OneTrust JSON script, decline consent, and CMP_CONSENT_GROUPS = C0001 only
  - _OneTrust GDPR Consent Tests_
    - Should load ad script
    - Should include "gdpr_consent" param in the GAM ad request
    - Should include "gdpr_consent.consent_string" (gdpr_consent) param in the Prebid request
    - Should include "user.ext.consent" (gdpr_consent) param in the Prebid Index Exchange request
    - Should include "gdpr_consent" param in the Prebid Magnite/Rubicon request
    - Should include "user.ext.consent" (gdpr_consent) param in the Prebid TheTradeDesk request
    - Should include "gdpr_iab.consent" (gdpr_consent) param in the Prebid Teads request
    - Should include "cmp_cs" (gdpr_consent) param in the Prebid Triple Lift request
    - Should include "gdprc" (gdpr_consent) param in the Amazon A9 bidders request
    - Should decline specific vendor and block vendor by ID upon
- **e2e-pw:gpp** `npm run e2e-pw:gpp`

  - _GPP US User/Us Site Tests_.
    - should load the above load
    - Verify that there is no OneTrust modal rendering on a US site as a US user
    - Verify that window.CMP_GPP_OPTOUT should return false
    - Verify that gptLayer.utils.Cookies.get("hdm_cmp") should return { "gpp": { "optOut": false } }
    - Verify that window.CMP_CONSENT should returns true
    - Verify that window.CMP_CONSENT_GROUPS should return "C0001,C0002,C0003,C0004" (there may be C0005 and another with BG in the name)
    - Verify the Ensighten bootstrap prod space of "hearst/mag" loads on the page
  - _Your Privacy Choices Test_.
    - Verify that window.CMP_GPP_OPTOUT should return true
    - Verify that gptLayer.utils.Cookies.get("hdm_cmp") should return { "gpp": { "optOut": true } }
    - Verify that gptLayer.utils.Cookies.get("OneTrustWPCCPAGoogleOptOut") should return true
    - Verify that window.CMP_CONSENT should return true
    - Verify that window.CMP_CONSENT_GROUPS should return "C0001,C0003"
    - Verify the Ensighten bootstrap prod space of "hearst/mag-dnt" loads on the page
    - Verify analytics loads, verify GA and GA4 are present and firing
    - Verify Google Ad Manager ad requests should append .dnt
    - Verify Ad requests expected results contain the following url params "iu_parts=36117602,.dnt, homepage, atf"
  - \_Testing GPP consent in bidders / US Users on US Sites\_\_.
    - Should include gpp consent string (gpp) in the Prebid request
    - Should include gpp consent string (gpp) in the Prebid Index Exchange request
    - Should include gpp consent string param in the Prebid Magnite/Rubicon request
    - Should include gpp consent string (gpp) param in the Prebid Triple Lift request
    - Should include gpp consent string (gpp) param in the Prebid TheTradeDesk request

- **e2e-pw:customAds** `npm run e2e-pw:customAds`

  - _High Impact Ad Tests ( Desktop Viewport / Mobile Viewport )_.
    - Verify that the ad creative should be visible on the page Verify that when a user clicks on main ad, the GA event should be `high_impact_image_ad_click`
    - Adhesion should be visible when the users scrolls the main ad out of view Verify that when a user clicks on adhesion ad, the GA event should be `high_impact_adhesion_ad_click`
    - Verify that when a user clicks on adhesion close button, the GA event should be `high_impact_adhesion_ad_closed`
  - _Native Assembly Ad Tests ( Desktop Viewport / Mobile Viewport )_.
    - Native Assembly Ad Image Tests
      - Verify that the ad creative should be visible on the page
      - Verify that when a user clicks on ad, the GA event should be `native_assembly_image_ad_click`
    - Native Assembly Ad Video Tests
      - Verify that the ad creative should be visible on the page
      - Verify that when a user clicks on ad, the GA event should be `native_assembly_video_ad_click`
  - Megahero product ad tests
  - Verify that the Megahero ad renders
    - Verify that the Megahero ad is full width on desktop/mobile and on mobile should be full height
    - Verify that a user can click on the Megahero ad
  - Superhero image ad tests
    - Verify that the Superhero ad renders
    - Verify that the Superhero ad is full width on both desktop/mobile and 450 height on desktop/mobile
      - Verify that a user can click on the Megahero ad (0:10s)
  - OCD ad tests
    - Verify that the OCD ad renders
    - Verify that a user can click on both the "Click for more" button and the "Advertiser" logo

- **e2e-pw:listicle** `npm run e2e-pw:listicle`
  - Should make a GA4 slide_view request - Listicle
    - Should have artid = brand_listicle_article#
    - Should have dtype = listicle
    - Should have tool = listicle
    - Should have ep.displayType = listicle
    - Should have ep.articleId = brand.listicle.article#
    - Should have HRST.article.template = listicle
    - Should have HRST.article.id = listicle
    - Should have HRST.article.display = listicle
    - Should have Should make a GA4 slide_view request - EmbedGallery
    - Should have artid = brand_gallery_article#
    - Should have dtype = gallery
    - Should have tool = gallery
    - Should have ep.displayType = gallery
    - Should have ep.articleId = brand.gallery.article#
    - Should have HRST.article.template = gallery
    - Should have HRST.article.id = gallery
    - Should have HRST.article.display = gallery
- **e2e-pw:videoAds** `npm run e2e-pw:videoAds`

  - Should make a video GAM sz=640x480 request
  - Verify that Video GAM requests contain the top level ad unit
  - Verify that gptLayer.videoKVP is contained within cust_params request
  - Verify GPP consent passing through video GAM
  - Verify vid_d parameter exists and matches video duration
  - Should return GDPR in GAM call if user accept consent, EUP site
  - Verify that all vids on page are set to sticky that have enabled on site and no JAM
  - Verify that sticky video players can be “closed” out (0:2s)
  - Verify that all videos autoplay that do not have metadata on page wherein autoplay is turned off
  - Verify that video ads do not jump out of frame and are correct size
  - should return player type
  - Verify pre-roll runs on player
  - Verify videos are not autoplaying if user declines consent, EUP site

- **e2e-pw:jamData** `npm run e2e-pw:jamData`
  - testing the article on autoSiteName
    - testing the homepage on autoSiteName
    - testing the listicle on autoSiteName
    - testing the longArticle on autoSiteName
    - testing the reviewArticle on autoSiteName
    - testing the section on autoSiteName
    - testing the vehicleCategory on autoSiteName
    - testing the vehicleCategoryRankings on autoSiteName
    - testing the vehicleMake on autoSiteName
    - testing the vehicleSpecs on autoSiteName

- **e2e-pw:proxyTests** `npm run e2e-pw:proxyTests`
  - this will serve to test the functionality of proxies
    - testing if get the same length array from the PAC
    - testing if the updated list of proxies from the PAC corresponds to the saved list
    - testing if all the saved proxies are working properly
  
- **updateProxes** `npm run updateProxes`
  - this will serve to update the ip addresses of the proxies and forcefully set the selected country of each proxyObject to its ip (even if they are already set to another country)

- **e2e-pw:slugTests** `npm run e2e-pw:slugTests`
  - testing if all the slugs in out data files are working
    -  testing the article of site
    -  testing the video of site
    -  testing the recipe of site
    -  testing the sponsor of site
    -  testing the listicle of site

For more information please look at [Playwright documentation](https://playwright.dev/docs/intro)
