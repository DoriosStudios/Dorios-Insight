# Dorios-Insight
A Minecraft Bedrock addon that shows a lot of configurable info of what are you looking at.


## What's planned

### Main Objetive: Improve the insight menu and command.
- Split `/insight` to `insightmenu`, `insightactivate`, etc.
- Clarify the menu buttons, categories and names.
  - Specifically: Add a new settings screen for "Conditions", as well as other for "System Settings". The menu should be completely organized.

### Secondary Objectives:
- [ ] Add the mob's name below the nickname (given by a nametag)
  - Should be configurable. Recommended options: 
    - **Nickname First** *(Default)*, 
    - **Mob Name First**, 
    - **Nickname After Mob Name**, 
    - **Mob Name After Nickname**, 
    - **Nickname Only**, 
    - **Mob Name Only**.
- [ ] Add different methods of displaying names.
  - Recommended options: 
    - **Translation Keys** *(Default)*, 
    - **Translate Id to Text**.
- [ ] Add Villager Professions fields
  - Should be configurable. Recommended options: 
    - **After Name**, 
    - **Below Name** *(Default)*, 
    - **Hidden**.
- [ ] Add a compatibility module for custom states and their definitions
- [ ] Add more styles of display for every "icon-based" field.
  - Should be configurable. Recommended options:
    - **Icons (Emojis)** *(Default)*,
    - **Text Type 1 ( Health: x/y )**,
    - **Text Type 2 ( Health: x% )**,
    - **Hybrid Type 1 ( ❤️ x/y )**,
    - **Hybrid Type 2 ( ❤️ x% )**,
    - *feel free to suggest more.*
- [ ] Add "tool tier" indicator. *(if it needs to be iron or diamond tier, for example.)*
  - Can be configurable. Recommended options:
    - **Boolean Indicator (Yes/No)** *(Default)*,
    - **Tier Indicator (Color)**,
    - **Tier Indicator (Ore)**
    - **Text Indicator ("Diamond")**
- [ ] Add a "Rox × Column" setting for tags, states and components
- [ ] Finish the compatibility with UtilityCraft, Atelier and similar. *(For custom fields, such as Energy, Fluid or Next Variant)*
- [ ] Rename pretty much every vanilla state, permutation, trait and component to better match an user friendly usage
- [ ] Add missing icons for effects *(Health Boost, Regeneration, Fatal Poison...)*
- [ ] Expand customization of Style.
  - Additionally but not confirmed: Add a custom type of display with params for advanced users.
- [ ] Fix entity translation (method of display).