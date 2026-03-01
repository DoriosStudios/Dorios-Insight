# Dorios-Insight
A Minecraft Bedrock addon that shows a lot of configurable info of what are you looking at.


## What's planned

### Main Objetive: Improve the insight menu and command.
- [x] Split `/insight` to `insightmenu`, `insightactivate`, etc.
- [x] Clarify the menu buttons, categories and names.
  - [x] Added dedicated settings screens for **Conditions** and **System Settings**.

### Command aliases currently available
- `/utilitycraft:insightmenu` — open the menu
- `/utilitycraft:insightmode <essential|detailed|debug>` — set global mode
- `/utilitycraft:insightactivate <on|off|toggle>` — local toggle
- `/utilitycraft:insightglobal <on|off|toggle|status>` — global toggle/status
- `/utilitycraft:insightnamespace <add|set> <namespace> <displayName>` — namespace alias

### Secondary Objectives:
- [x] Add the mob's name below the nickname (given by a nametag)
  - Should be configurable. Recommended options: 
    - **Nickname First** *(Default)*, 
    - **Mob Name First**, 
    - **Nickname After Mob Name**, 
    - **Mob Name After Nickname**, 
    - **Nickname Only**, 
    - **Mob Name Only**.
- [x] Add different methods of displaying names.
  - Recommended options: 
    - **Translation Keys** *(Default)*, 
    - **Translate Id to Text**.
- [x] Add Villager Professions fields
  - Should be configurable. Recommended options: 
    - **After Name**, 
    - **Below Name** *(Default)*, 
    - **Hidden**.
- [x] Add a compatibility module for custom states and their definitions
- [x] Add more styles of display for every "icon-based" field.
  - Should be configurable. Recommended options:
    - **Icons (Emojis)** *(Default)*,
    - **Text Type 1 ( Health: x/y )**,
    - **Text Type 2 ( Health: x% )**,
    - **Hybrid Type 1 ( ❤️ x/y )**,
    - **Hybrid Type 2 ( ❤️ x% )**,
    - *feel free to suggest more.*
- [x] Add "tool tier" indicator. *(if it needs to be iron or diamond tier, for example.)*
  - Can be configurable. Recommended options:
    - **Boolean Indicator (Yes/No)** *(Default)*,
    - **Tier Indicator (Color)**,
    - **Tier Indicator (Ore)**
    - **Text Indicator ("Diamond")**
- [ ] Add a "Row × Column" setting for tags, states and components *(partially implemented)*
  - [x] States, tags and entity families now support configurable columns.
  - [ ] Component menu grid layout still pending.
- [ ] Finish the compatibility with UtilityCraft, Atelier and similar. *(For custom fields, such as Energy, Fluid or Next Variant)*
- [ ] Rename pretty much every vanilla state, permutation, trait and component to better match an user friendly usage *(partially implemented)*
  - [x] Added alias layer with common user-friendly names.
  - [ ] Full vanilla coverage still pending.
- [x] Add missing icons for effects *(Health Boost, Regeneration, Fatal Poison...)*
- [x] Expand customization of Style.
  - Additionally but not confirmed: Add a custom type of display with params for advanced users.
- [x] Fix entity translation (method of display).