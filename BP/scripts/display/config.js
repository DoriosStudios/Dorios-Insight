import { world } from "@minecraft/server";

const WORLD_MODE_DYNAMIC_PROPERTY = "insight:mode";
const WORLD_ENABLED_DYNAMIC_PROPERTY = "insight:enabled";
const WORLD_ADMIN_ONLY_DYNAMIC_PROPERTY = "insight:admin_only";
const WORLD_ADMIN_SOURCE_ID_DYNAMIC_PROPERTY = "insight:admin_source_id";
const WORLD_ADMIN_SOURCE_NAME_DYNAMIC_PROPERTY = "insight:admin_source_name";
const WORLD_HOST_ID_DYNAMIC_PROPERTY = "insight:host_id";
const WORLD_HOST_NAME_DYNAMIC_PROPERTY = "insight:host_name";
const PLAYER_SETTINGS_DYNAMIC_PROPERTY = "insight:player_settings";
const ADMIN_PLAYER_TAG = "admin";
const LEGACY_ADMIN_PLAYER_TAG = "insight:admin";

const memoryFallback = {
    mode: "essential",
    enabled: true,
    adminOnly: false,
    adminSourceId: "",
    adminSourceName: "",
    hostId: "",
    hostName: "",
    playerSettings: new Map()
};

export const InsightModes = Object.freeze({
    Essential: "essential",
    Detailed: "detailed",
    Debug: "debug"
});

export const VisibilityPolicies = Object.freeze({
    Show: "show",
    ShowWhenSneaking: "sneak",
    CreativeOnly: "creative",
    SneakingAndCreative: "sneak_creative",
    Hide: "hide"
});

export const VisibilityPolicyLabels = Object.freeze([
    Object.freeze({ key: VisibilityPolicies.Show, label: "Show", labelKey: "ui.dorios.insight.option.visibility.show" }),
    Object.freeze({ key: VisibilityPolicies.ShowWhenSneaking, label: "Show When Sneaking", labelKey: "ui.dorios.insight.option.visibility.show_when_sneaking" }),
    Object.freeze({ key: VisibilityPolicies.CreativeOnly, label: "Creative Only", labelKey: "ui.dorios.insight.option.visibility.creative_only" }),
    Object.freeze({ key: VisibilityPolicies.SneakingAndCreative, label: "Sneaking + Creative", labelKey: "ui.dorios.insight.option.visibility.sneaking_and_creative" }),
    Object.freeze({ key: VisibilityPolicies.Hide, label: "Hide", labelKey: "ui.dorios.insight.option.visibility.hide" })
]);

export const EffectDisplayModes = Object.freeze({
    Emoji: "emoji",
    Text: "text"
});

export const EffectDisplayModeLabels = Object.freeze([
    Object.freeze({ key: EffectDisplayModes.Emoji, label: "Emoji", labelKey: "ui.dorios.insight.option.effect_display.emoji" }),
    Object.freeze({ key: EffectDisplayModes.Text, label: "Text", labelKey: "ui.dorios.insight.option.effect_display.text" })
]);

export const DisplayStyles = Object.freeze({
    Icon: "icon",
    IconValue: "icon_value",
    Text: "text", // Legacy alias, normalized to text_full.
    TextFull: "text_full",
    TextPercent: "text_percent",
    HybridFull: "hybrid_full",
    HybridPercent: "hybrid_percent"
});

export const DisplayStyleLabels = Object.freeze([
    Object.freeze({ key: DisplayStyles.Icon, label: "Icon", labelKey: "ui.dorios.insight.option.display_style.icon" }),
    Object.freeze({ key: DisplayStyles.IconValue, label: "Icon + Value (❤️ x/y)", labelKey: "ui.dorios.insight.option.display_style.icon_value" }),
    Object.freeze({ key: DisplayStyles.TextFull, label: "Text Type 1 (Health: x/y)", labelKey: "ui.dorios.insight.option.display_style.text_full" }),
    Object.freeze({ key: DisplayStyles.TextPercent, label: "Text Type 2 (Health: x%)", labelKey: "ui.dorios.insight.option.display_style.text_percent" }),
    Object.freeze({ key: DisplayStyles.HybridFull, label: "Hybrid Type 1 (❤️ x/y)", labelKey: "ui.dorios.insight.option.display_style.hybrid_full" }),
    Object.freeze({ key: DisplayStyles.HybridPercent, label: "Hybrid Type 2 (❤️ x%)", labelKey: "ui.dorios.insight.option.display_style.hybrid_percent" })
]);

export const HudDisplayModes = Object.freeze({
    ShowInsight: "show_insight",
    Both: "both",
    ShowVanilla: "show_vanilla",
    None: "none"
});

export const HudDisplayModeLabels = Object.freeze([
    Object.freeze({ key: HudDisplayModes.ShowInsight, label: "Show Insight", labelKey: "ui.dorios.insight.option.hud_display.show_insight" }),
    Object.freeze({ key: HudDisplayModes.Both, label: "Both", labelKey: "ui.dorios.insight.option.hud_display.both" }),
    Object.freeze({ key: HudDisplayModes.ShowVanilla, label: "Show Vanilla", labelKey: "ui.dorios.insight.option.hud_display.show_vanilla" }),
    Object.freeze({ key: HudDisplayModes.None, label: "None", labelKey: "ui.dorios.insight.option.hud_display.none" })
]);

export const HudIndicatorModes = Object.freeze({
    Hidden: "hidden",
    IconAndHeartCount: "icon_and_heart_count",
    IconAndVanillaAmount: "icon_and_heart_count",
    IconAndHealthAmount: "icon_and_points",
    IconAndIndicator: "icon_and_points",
    IconAndPoints: "icon_and_points"
});

export const HudIndicatorModeLabels = Object.freeze([
    Object.freeze({ key: HudIndicatorModes.Hidden, label: "Hidden", labelKey: "ui.dorios.insight.option.hud_indicator.hidden" }),
    Object.freeze({ key: HudIndicatorModes.IconAndHeartCount, label: "Icon + Heart Count", labelKey: "ui.dorios.insight.option.hud_indicator.icon_and_heart_count" }),
    Object.freeze({ key: HudIndicatorModes.IconAndHealthAmount, label: "Icon + Health Amount", labelKey: "ui.dorios.insight.option.hud_indicator.icon_and_health_amount" })
]);

export const HudElementPositionModes = Object.freeze({
    Center: "center",
    TopRight: "top_right",
    MiddleRight: "middle_right",
    BottomRight: "bottom_right",
    BottomLeft: "bottom_left"
});

export const HudElementPositionModeLabels = Object.freeze([
    Object.freeze({ key: HudElementPositionModes.Center, label: "Center (Default)", labelKey: "ui.dorios.insight.option.hud_position.center" }),
    Object.freeze({ key: HudElementPositionModes.TopRight, label: "Top Right", labelKey: "ui.dorios.insight.option.hud_position.top_right" }),
    Object.freeze({ key: HudElementPositionModes.MiddleRight, label: "Middle Right", labelKey: "ui.dorios.insight.option.hud_position.middle_right" }),
    Object.freeze({ key: HudElementPositionModes.BottomRight, label: "Bottom Right", labelKey: "ui.dorios.insight.option.hud_position.bottom_right" }),
    Object.freeze({ key: HudElementPositionModes.BottomLeft, label: "Bottom Left", labelKey: "ui.dorios.insight.option.hud_position.bottom_left" })
]);

export const HudInventoryDisplayModes = Object.freeze({
    Full: "full",
    HotbarOnly: "hotbar_only",
    InventoryOnly: "inventory_only"
});

export const HudInventoryDisplayModeLabels = Object.freeze([
    Object.freeze({ key: HudInventoryDisplayModes.Full, label: "Full", labelKey: "ui.dorios.insight.option.hud_inventory_display.full" }),
    Object.freeze({ key: HudInventoryDisplayModes.HotbarOnly, label: "Hotbar Only", labelKey: "ui.dorios.insight.option.hud_inventory_display.hotbar_only" }),
    Object.freeze({ key: HudInventoryDisplayModes.InventoryOnly, label: "Inventory Only", labelKey: "ui.dorios.insight.option.hud_inventory_display.inventory_only" })
]);

export const HudElementOrientationModes = Object.freeze({
    Horizontal: "horizontal",
    Vertical: "vertical"
});

export const HudElementOrientationModeLabels = Object.freeze([
    Object.freeze({ key: HudElementOrientationModes.Horizontal, label: "Horizontal", labelKey: "ui.dorios.insight.option.hud_orientation.horizontal" }),
    Object.freeze({ key: HudElementOrientationModes.Vertical, label: "Vertical", labelKey: "ui.dorios.insight.option.hud_orientation.vertical" })
]);

export const WailaColorThemes = Object.freeze({
    Default: "default",
    Dark: "dark",
    Copper: "copper",
    Magenta: "magenta",
    Cyan: "cyan",
    Blood: "blood",
    Ascane: "ascane"
});

export const WailaColorThemeLabels = Object.freeze([
    Object.freeze({ key: WailaColorThemes.Default, label: "Default (Dark Blue)", labelKey: "ui.dorios.insight.option.waila_theme.default" }),
    Object.freeze({ key: WailaColorThemes.Dark, label: "Dark", labelKey: "ui.dorios.insight.option.waila_theme.dark" }),
    Object.freeze({ key: WailaColorThemes.Copper, label: "Copper", labelKey: "ui.dorios.insight.option.waila_theme.copper" }),
    Object.freeze({ key: WailaColorThemes.Magenta, label: "Magenta", labelKey: "ui.dorios.insight.option.waila_theme.magenta" }),
    Object.freeze({ key: WailaColorThemes.Cyan, label: "Cyan", labelKey: "ui.dorios.insight.option.waila_theme.cyan" }),
    Object.freeze({ key: WailaColorThemes.Blood, label: "Blood", labelKey: "ui.dorios.insight.option.waila_theme.blood" }),
    Object.freeze({ key: WailaColorThemes.Ascane, label: "Ascane", labelKey: "ui.dorios.insight.option.waila_theme.ascane" })
]);

export const HudDurabilityDisplayModes = Object.freeze({
    Hidden: "hidden",
    Values: "values",
    Percent: "percent",
    ValuesAndPercent: "values_percent",
    Bar: "bar"
});

export const HudDurabilityDisplayModeLabels = Object.freeze([
    Object.freeze({ key: HudDurabilityDisplayModes.Hidden, label: "Hidden", labelKey: "ui.dorios.insight.option.hud_durability_display.hidden" }),
    Object.freeze({ key: HudDurabilityDisplayModes.Values, label: "Values (123/1561)", labelKey: "ui.dorios.insight.option.hud_durability_display.values" }),
    Object.freeze({ key: HudDurabilityDisplayModes.Percent, label: "Percent (92%)", labelKey: "ui.dorios.insight.option.hud_durability_display.percent" }),
    Object.freeze({ key: HudDurabilityDisplayModes.ValuesAndPercent, label: "Values + Percent", labelKey: "ui.dorios.insight.option.hud_durability_display.values_and_percent" }),
    Object.freeze({ key: HudDurabilityDisplayModes.Bar, label: "Bar", labelKey: "ui.dorios.insight.option.hud_durability_display.bar" })
]);

export const HudDurabilityPositionModes = Object.freeze({
    RightHotbar: "right_hotbar",
    LeftHotbar: "left_hotbar",
    BelowCrosshair: "below_crosshair",
    BottomLeft: "bottom_left",
    BottomRight: "bottom_right"
});

export const HudDurabilityPositionModeLabels = Object.freeze([
    Object.freeze({ key: HudDurabilityPositionModes.RightHotbar, label: "Right of Hotbar", labelKey: "ui.dorios.insight.option.hud_durability_position.right_hotbar" }),
    Object.freeze({ key: HudDurabilityPositionModes.LeftHotbar, label: "Left of Hotbar", labelKey: "ui.dorios.insight.option.hud_durability_position.left_hotbar" }),
    Object.freeze({ key: HudDurabilityPositionModes.BelowCrosshair, label: "Below Crosshair", labelKey: "ui.dorios.insight.option.hud_durability_position.below_crosshair" }),
    Object.freeze({ key: HudDurabilityPositionModes.BottomLeft, label: "Bottom Left HUD", labelKey: "ui.dorios.insight.option.hud_durability_position.bottom_left" }),
    Object.freeze({ key: HudDurabilityPositionModes.BottomRight, label: "Bottom Right HUD", labelKey: "ui.dorios.insight.option.hud_durability_position.bottom_right" })
]);

export const HudQuickCounterModes = Object.freeze({
    Hidden: "hidden",
    HandStack: "hand_stack",
    InventoryTotal: "inventory_total",
    DurabilityCurrent: "durability_current",
    DurabilityMax: "durability_max",
    DurabilityPercent: "durability_percent",
    XpLevel: "xp_level",
    Speed: "speed"
});

export const HudQuickCounterModeLabels = Object.freeze([
    Object.freeze({ key: HudQuickCounterModes.Hidden, label: "Hidden", labelKey: "ui.dorios.insight.option.quick_counter.hidden" }),
    Object.freeze({ key: HudQuickCounterModes.HandStack, label: "Hand Stack", labelKey: "ui.dorios.insight.option.quick_counter.hand_stack" }),
    Object.freeze({ key: HudQuickCounterModes.InventoryTotal, label: "Inventory Total", labelKey: "ui.dorios.insight.option.quick_counter.inventory_total" }),
    Object.freeze({ key: HudQuickCounterModes.DurabilityCurrent, label: "Durability Current", labelKey: "ui.dorios.insight.option.quick_counter.durability_current" }),
    Object.freeze({ key: HudQuickCounterModes.DurabilityMax, label: "Durability Max", labelKey: "ui.dorios.insight.option.quick_counter.durability_max" }),
    Object.freeze({ key: HudQuickCounterModes.DurabilityPercent, label: "Durability Percent", labelKey: "ui.dorios.insight.option.quick_counter.durability_percent" }),
    Object.freeze({ key: HudQuickCounterModes.XpLevel, label: "XP Level", labelKey: "ui.dorios.insight.option.quick_counter.xp_level" }),
    Object.freeze({ key: HudQuickCounterModes.Speed, label: "Speed", labelKey: "ui.dorios.insight.option.quick_counter.speed" })
]);

export const WailaAnchorModes = Object.freeze({
    TopLeft: "top_left",
    TopMiddle: "top_middle",
    TopRight: "top_right",
    LeftMiddle: "left_middle",
    RightMiddle: "right_middle",
    BottomLeft: "bottom_left",
    BottomRight: "bottom_right"
});

export const WailaAnchorModeLabels = Object.freeze([
    Object.freeze({ key: WailaAnchorModes.TopLeft, label: "Top Left", labelKey: "ui.dorios.insight.option.waila_anchor.top_left" }),
    Object.freeze({ key: WailaAnchorModes.TopMiddle, label: "Top Middle", labelKey: "ui.dorios.insight.option.waila_anchor.top_middle" }),
    Object.freeze({ key: WailaAnchorModes.TopRight, label: "Top Right", labelKey: "ui.dorios.insight.option.waila_anchor.top_right" }),
    Object.freeze({ key: WailaAnchorModes.LeftMiddle, label: "Left Middle", labelKey: "ui.dorios.insight.option.waila_anchor.left_middle" }),
    Object.freeze({ key: WailaAnchorModes.RightMiddle, label: "Right Middle", labelKey: "ui.dorios.insight.option.waila_anchor.right_middle" }),
    Object.freeze({ key: WailaAnchorModes.BottomLeft, label: "Bottom Left", labelKey: "ui.dorios.insight.option.waila_anchor.bottom_left" }),
    Object.freeze({ key: WailaAnchorModes.BottomRight, label: "Bottom Right", labelKey: "ui.dorios.insight.option.waila_anchor.bottom_right" })
]);

export const WailaOffsetModes = Object.freeze({
    Negative: "negative",
    Center: "center",
    Positive: "positive"
});

export const WailaHorizontalOffsetModeLabels = Object.freeze([
    Object.freeze({ key: WailaOffsetModes.Negative, label: "Left", labelKey: "ui.dorios.insight.option.waila_horizontal_offset.left" }),
    Object.freeze({ key: WailaOffsetModes.Center, label: "Center", labelKey: "ui.dorios.insight.option.waila_horizontal_offset.center" }),
    Object.freeze({ key: WailaOffsetModes.Positive, label: "Right", labelKey: "ui.dorios.insight.option.waila_horizontal_offset.right" })
]);

export const WailaVerticalOffsetModeLabels = Object.freeze([
    Object.freeze({ key: WailaOffsetModes.Negative, label: "Up", labelKey: "ui.dorios.insight.option.waila_vertical_offset.up" }),
    Object.freeze({ key: WailaOffsetModes.Center, label: "Center", labelKey: "ui.dorios.insight.option.waila_vertical_offset.center" }),
    Object.freeze({ key: WailaOffsetModes.Positive, label: "Down", labelKey: "ui.dorios.insight.option.waila_vertical_offset.down" })
]);

export const WailaSizePresets = Object.freeze({
    Compact: "compact",
    Normal: "normal",
    Large: "large",
    Huge: "huge"
});

export const WailaSizePresetLabels = Object.freeze([
    Object.freeze({ key: WailaSizePresets.Compact, label: "Compact", labelKey: "ui.dorios.insight.option.waila_size.compact" }),
    Object.freeze({ key: WailaSizePresets.Normal, label: "Normal", labelKey: "ui.dorios.insight.option.waila_size.normal" }),
    Object.freeze({ key: WailaSizePresets.Large, label: "Large", labelKey: "ui.dorios.insight.option.waila_size.large" }),
    Object.freeze({ key: WailaSizePresets.Huge, label: "Huge", labelKey: "ui.dorios.insight.option.waila_size.huge" })
]);

export const WailaWidthModes = Object.freeze({
    Normal: "normal",
    Wide: "wide",
    Wider: "wider",
    Widest: "widest"
});

export const WailaWidthModeLabels = Object.freeze([
    Object.freeze({ key: WailaWidthModes.Normal, label: "Normal", labelKey: "ui.dorios.insight.option.waila_width.normal" }),
    Object.freeze({ key: WailaWidthModes.Wide, label: "Wide", labelKey: "ui.dorios.insight.option.waila_width.wide" }),
    Object.freeze({ key: WailaWidthModes.Wider, label: "Wider", labelKey: "ui.dorios.insight.option.waila_width.wider" }),
    Object.freeze({ key: WailaWidthModes.Widest, label: "Widest", labelKey: "ui.dorios.insight.option.waila_width.widest" })
]);

export const WailaHeightModes = Object.freeze({
    Normal: "normal",
    Tall: "tall",
    Taller: "taller",
    Tallest: "tallest"
});

export const WailaHeightModeLabels = Object.freeze([
    Object.freeze({ key: WailaHeightModes.Normal, label: "Normal", labelKey: "ui.dorios.insight.option.waila_height.normal" }),
    Object.freeze({ key: WailaHeightModes.Tall, label: "Tall", labelKey: "ui.dorios.insight.option.waila_height.tall" }),
    Object.freeze({ key: WailaHeightModes.Taller, label: "Taller", labelKey: "ui.dorios.insight.option.waila_height.taller" }),
    Object.freeze({ key: WailaHeightModes.Tallest, label: "Tallest", labelKey: "ui.dorios.insight.option.waila_height.tallest" })
]);

export const ModePresetSummaryModes = Object.freeze({
    Hidden: "hidden",
    Summary: "summary",
    SummaryAndChanged: "summary_and_changed",
    ChangedOnly: "changed_only"
});

export const ModePresetSummaryModeLabels = Object.freeze([
    Object.freeze({ key: ModePresetSummaryModes.Hidden, label: "Hidden", labelKey: "ui.dorios.insight.option.mode_summary.hidden" }),
    Object.freeze({ key: ModePresetSummaryModes.Summary, label: "Show Enabled Summary", labelKey: "ui.dorios.insight.option.mode_summary.summary" }),
    Object.freeze({ key: ModePresetSummaryModes.SummaryAndChanged, label: "Show Summary + Changed", labelKey: "ui.dorios.insight.option.mode_summary.summary_and_changed" }),
    Object.freeze({ key: ModePresetSummaryModes.ChangedOnly, label: "Show Changed Only", labelKey: "ui.dorios.insight.option.mode_summary.changed_only" })
]);

export const EntityNameDisplayModes = Object.freeze({
    NicknameFirst: "nickname_first",
    MobNameFirst: "mob_name_first",
    NicknameAfterMobName: "nickname_after_mob_name",
    MobNameAfterNickname: "mob_name_after_nickname",
    NicknameOnly: "nickname_only",
    MobNameOnly: "mob_name_only"
});

export const EntityNameDisplayModeLabels = Object.freeze([
    Object.freeze({ key: EntityNameDisplayModes.NicknameFirst, label: "Nickname First", labelKey: "ui.dorios.insight.option.entity_name_display.nickname_first" }),
    Object.freeze({ key: EntityNameDisplayModes.MobNameFirst, label: "Mob Name First", labelKey: "ui.dorios.insight.option.entity_name_display.mob_name_first" }),
    Object.freeze({ key: EntityNameDisplayModes.NicknameAfterMobName, label: "Nickname After Mob Name", labelKey: "ui.dorios.insight.option.entity_name_display.nickname_after_mob_name" }),
    Object.freeze({ key: EntityNameDisplayModes.MobNameAfterNickname, label: "Mob Name After Nickname", labelKey: "ui.dorios.insight.option.entity_name_display.mob_name_after_nickname" }),
    Object.freeze({ key: EntityNameDisplayModes.NicknameOnly, label: "Nickname Only", labelKey: "ui.dorios.insight.option.entity_name_display.nickname_only" }),
    Object.freeze({ key: EntityNameDisplayModes.MobNameOnly, label: "Mob Name Only", labelKey: "ui.dorios.insight.option.entity_name_display.mob_name_only" })
]);

export const EntityNameResolveModes = Object.freeze({
    TranslationKeys: "translation_keys",
    TypeIdToText: "typeid_text"
});

export const EntityNameResolveModeLabels = Object.freeze([
    Object.freeze({ key: EntityNameResolveModes.TranslationKeys, label: "Translation Keys", labelKey: "ui.dorios.insight.option.entity_name_resolve.translation_keys" }),
    Object.freeze({ key: EntityNameResolveModes.TypeIdToText, label: "Translate ID to Text", labelKey: "ui.dorios.insight.option.entity_name_resolve.type_id_to_text" })
]);

export const NamespaceDisplayModes = Object.freeze({
    Name: "name",
    NameAndIdentifier: "name_identifier",
    Identifier: "identifier"
});

export const NamespaceDisplayModeLabels = Object.freeze([
    Object.freeze({ key: NamespaceDisplayModes.Name, label: "Display Name", labelKey: "ui.dorios.insight.option.namespace_display.name" }),
    Object.freeze({ key: NamespaceDisplayModes.NameAndIdentifier, label: "Display Name + Identifier", labelKey: "ui.dorios.insight.option.namespace_display.name_identifier" }),
    Object.freeze({ key: NamespaceDisplayModes.Identifier, label: "Identifier Only", labelKey: "ui.dorios.insight.option.namespace_display.identifier" })
]);

export const VillagerProfessionDisplayModes = Object.freeze({
    AfterName: "after_name",
    BelowName: "below_name",
    Hidden: "hidden"
});

export const VillagerProfessionDisplayModeLabels = Object.freeze([
    Object.freeze({ key: VillagerProfessionDisplayModes.AfterName, label: "After Name", labelKey: "ui.dorios.insight.option.villager_profession.after_name" }),
    Object.freeze({ key: VillagerProfessionDisplayModes.BelowName, label: "Below Name", labelKey: "ui.dorios.insight.option.villager_profession.below_name" }),
    Object.freeze({ key: VillagerProfessionDisplayModes.Hidden, label: "Hidden", labelKey: "ui.dorios.insight.option.villager_profession.hidden" })
]);

export const ToolTierIndicatorModes = Object.freeze({
    Hidden: "hidden",
    BooleanIndicator: "boolean_indicator",
    TierIndicatorColor: "tier_indicator_color",
    TierIndicatorOre: "tier_indicator_ore",
    TextIndicator: "text_indicator",
    IconAndIndicator: "icon_and_indicator"
});

export const ToolTierIndicatorModeLabels = Object.freeze([
    Object.freeze({ key: ToolTierIndicatorModes.Hidden, label: "Hidden", labelKey: "ui.dorios.insight.option.tool_tier.hidden" }),
    Object.freeze({ key: ToolTierIndicatorModes.BooleanIndicator, label: "Boolean Indicator (Yes/No)", labelKey: "ui.dorios.insight.option.tool_tier.boolean_indicator" }),
    Object.freeze({ key: ToolTierIndicatorModes.TierIndicatorColor, label: "Tier Indicator (Color)", labelKey: "ui.dorios.insight.option.tool_tier.tier_indicator_color" }),
    Object.freeze({ key: ToolTierIndicatorModes.TierIndicatorOre, label: "Tier Indicator (Ore)", labelKey: "ui.dorios.insight.option.tool_tier.tier_indicator_ore" }),
    Object.freeze({ key: ToolTierIndicatorModes.TextIndicator, label: "Text Indicator (Diamond)", labelKey: "ui.dorios.insight.option.tool_tier.text_indicator" }),
    Object.freeze({ key: ToolTierIndicatorModes.IconAndIndicator, label: "Tool Icons + Indicator", labelKey: "ui.dorios.insight.option.tool_tier.icon_and_indicator" })
]);

export const ToolIndicatorPlacementModes = Object.freeze({
    BeforeName: "before_name",
    AfterName: "after_name",
    BelowName: "below_name"
});

export const ToolIndicatorPlacementModeLabels = Object.freeze([
    Object.freeze({ key: ToolIndicatorPlacementModes.BeforeName, label: "Before Name", labelKey: "ui.dorios.insight.option.tool_position.before_name" }),
    Object.freeze({ key: ToolIndicatorPlacementModes.AfterName, label: "After Name", labelKey: "ui.dorios.insight.option.tool_position.after_name" }),
    Object.freeze({ key: ToolIndicatorPlacementModes.BelowName, label: "Below Name", labelKey: "ui.dorios.insight.option.tool_position.below_name" })
]);

export const ToolIndicatorColorOptions = Object.freeze([
    Object.freeze({ key: "§7", label: "Gray (Default)", labelKey: "ui.dorios.insight.option.tool_color.gray" }),
    Object.freeze({ key: "§f", label: "White", labelKey: "ui.dorios.insight.option.tool_color.white" }),
    Object.freeze({ key: "§e", label: "Yellow", labelKey: "ui.dorios.insight.option.tool_color.yellow" }),
    Object.freeze({ key: "§a", label: "Green", labelKey: "ui.dorios.insight.option.tool_color.green" }),
    Object.freeze({ key: "§b", label: "Aqua", labelKey: "ui.dorios.insight.option.tool_color.aqua" }),
    Object.freeze({ key: "§9", label: "Blue", labelKey: "ui.dorios.insight.option.tool_color.blue" }),
    Object.freeze({ key: "§d", label: "Light Purple", labelKey: "ui.dorios.insight.option.tool_color.light_purple" }),
    Object.freeze({ key: "§c", label: "Red", labelKey: "ui.dorios.insight.option.tool_color.red" })
]);

export const InsightComponentDefinitions = Object.freeze([
    // All of these will eventually use localization keys, but for now the labels are hardcoded in English.
    Object.freeze({ key: "namespace", label: "Namespace Label" }),
    Object.freeze({ key: "customFields", label: "Custom Fields" }),
    Object.freeze({ key: "customEnergyInfo", label: "UtilityCraft: Energy Info" }),
    Object.freeze({ key: "customFluidInfo", label: "Custom: Fluid Info" }),
    Object.freeze({ key: "customGasInfo", label: "Custom: Gas Info" }),
    Object.freeze({ key: "customRotationInfo", label: "UtilityCraft: Rotation Info" }),
    Object.freeze({ key: "customMachineProgress", label: "UtilityCraft: Machine Progress" }),
    Object.freeze({ key: "customCobblestoneCount", label: "UtilityCraft: Cobblestone Count" }),
    Object.freeze({ key: "customVariantPreview", label: "Dorios' Atelier: Variant Preview" }),
    Object.freeze({ key: "blockStates", label: "Block States" }),
    Object.freeze({ key: "blockTags", label: "Block Tags" }),
    Object.freeze({ key: "health", label: "Entity Health" }),
    Object.freeze({ key: "absorption", label: "Absorption Hearts" }),
    Object.freeze({ key: "armor", label: "Player Armor" }),
    Object.freeze({ key: "hunger", label: "Player Hunger" }),
    Object.freeze({ key: "hungerEffect", label: "Hunger Effect Icons" }),
    Object.freeze({ key: "airBubbles", label: "Air Bubbles" }),
    Object.freeze({ key: "effects", label: "Status Effects" }),
    Object.freeze({ key: "effectHearts", label: "Status Heart Effects" }),
    Object.freeze({ key: "frozenHearts", label: "Frozen Hearts (Deprecated / Non-functional)" }),
    Object.freeze({ key: "animalHearts", label: "Rideable Hearts" }),
    Object.freeze({ key: "tameable", label: "Tameable Status" }),
    Object.freeze({ key: "tameFoods", label: "Tame Foods" }),
    Object.freeze({ key: "technical", label: "Technical Summary" }),
    Object.freeze({ key: "coordinates", label: "Coordinates" }),
    Object.freeze({ key: "typeId", label: "Type Identifier" }),
    Object.freeze({ key: "entityTags", label: "Entity Tags" }),
    Object.freeze({ key: "entityFamilies", label: "Entity Families" }),
    Object.freeze({ key: "velocity", label: "Entity Velocity" }),
    Object.freeze({ key: "namespaceResolution", label: "Namespace Resolution Debug" })
]);

const DeprecatedInsightComponents = Object.freeze(new Set([
    "frozenHearts"
]));

export function isInsightComponentDeprecated(componentKey) {
    return DeprecatedInsightComponents.has(String(componentKey || "").trim());
}

export const InsightConfig = Object.freeze({
    system: {
        showLoadMessage: true,
        loadMessage: "§a[Dorios' Insight]§r loaded",
        showInitializationModeMessage: true,
        defaultMode: InsightModes.Essential,
        minMaxDistance: 3,
        maxMaxDistance: 24,
        minUpdateIntervalTicks: 1,
        maxUpdateIntervalTicks: 20,
        minUnchangedTargetRefreshTicks: 1,
        maxUnchangedTargetRefreshTicks: 40,
        minClearAfterNoTargetTicks: 0,
        maxClearAfterNoTargetTicks: 200,
        minLinkedEntityScanIntervalTicks: 1,
        maxLinkedEntityScanIntervalTicks: 200,
        minLinkedEntityScanMaxDistance: 0.5,
        maxLinkedEntityScanMaxDistance: 4,
        maxVisibleStatesCap: 20,
        maxVisibleTagsCap: 20,
        maxVisibleFamiliesCap: 20,
        maxVisibleEffectsCap: 20,
        maxLayoutColumns: 6,
        maxHeartsPerLine: 10,
        maxHeartDisplayHealth: 100,
        minMaxHeartDisplayHealth: 20,
        maxMaxHeartDisplayHealth: 500
    },
    display: {
        namespaceColor: "§9",
        technicalColor: "§7",
        tagsColor: "§8",
        separator: "\n----------",
        moreRowsLabel: "more rows...",
        moreTagsLabel: "more tags...",
        moreFamiliesLabel: "more families...",
        initializedPrefix: "§aDorios' Insight Initialized on "
    },
    compatibility: {
        deduplicateActionbar: true,
        unchangedTargetRefreshTicks: 8,
        useEntityHitFallback: true
    },
    commands: {
        prefix: "!insight"
    },
    playerTags: {
        disabled: "insight:disable",
        sneakOnly: "insight:sneak_only",
        hideNamespace: "insight:hide_namespace",
        hideHealth: "insight:hide_health",
        technicalView: "insight:technical",
        blockTags: "insight:block_tags",
        hideBlockTags: "insight:hide_block_tags",
        namespaceDebug: "insight:namespace_debug"
    }
});

export const InsightModePresets = Object.freeze({
    [InsightModes.Essential]: Object.freeze({
        label: "Essential",
        labelKey: "ui.dorios.insight.mode.essential",
        runtime: Object.freeze({
            maxDistance: 7,
            updateIntervalTicks: 3,
            unchangedTargetRefreshTicks: 8,
            includeLiquidBlocks: false,
            includeInvisibleEntities: true,
            clearAfterNoTargetTicks: 20,
            linkedEntityScanIntervalTicks: 20,
            linkedEntityScanMaxDistance: 1.35,
            ignoreMachineHelperEntities: true,
            maxVisibleStates: 3,
            maxVisibleBlockTags: 3,
            maxVisibleEntityTags: 0,
            maxVisibleEntityFamilies: 0,
            maxVisibleEffects: 3,
            maxHeartDisplayHealth: 100,
            effectDisplayMode: EffectDisplayModes.Emoji,
            displayStyle: DisplayStyles.Icon,
            healthDisplayStyle: DisplayStyles.Icon,
            hungerDisplayStyle: DisplayStyles.Icon,
            armorDisplayStyle: DisplayStyles.Icon,
            absorptionDisplayStyle: DisplayStyles.Icon,
            airDisplayStyle: DisplayStyles.Icon,
            nameDisplayMode: EntityNameDisplayModes.NicknameFirst,
            nameResolveMode: EntityNameResolveModes.TranslationKeys,
            blockNameResolveMode: EntityNameResolveModes.TranslationKeys,
            namespaceDisplayMode: NamespaceDisplayModes.Name,
            villagerProfessionDisplay: VillagerProfessionDisplayModes.BelowName,
            toolTierIndicatorMode: ToolTierIndicatorModes.BooleanIndicator,
            toolIndicatorPlacement: ToolIndicatorPlacementModes.BeforeName,
            toolIndicatorColor: "§7",
            modePresetSummaryMode: ModePresetSummaryModes.SummaryAndChanged,
            hudHealthVisibilityMode: HudDisplayModes.ShowVanilla,
            hudHungerVisibilityMode: HudDisplayModes.ShowVanilla,
            hudSaturationVisibilityMode: HudDisplayModes.ShowVanilla,
            hudToughnessVisibilityMode: HudDisplayModes.ShowVanilla,
            hudHealthIndicatorMode: HudIndicatorModes.IconAndPoints,
            hudHungerIndicatorMode: HudIndicatorModes.IconAndPoints,
            hudInventoryEnabled: false,
            hudInventoryPosition: HudElementPositionModes.Center,
            hudInventoryDisplayMode: HudInventoryDisplayModes.Full,
            hudInventoryOrientation: HudElementOrientationModes.Horizontal,
            hudDurabilityDisplayMode: HudDurabilityDisplayModes.ValuesAndPercent,
            hudDurabilityPosition: HudDurabilityPositionModes.RightHotbar,
            hudDurabilityShowWhenFull: false,
            hudQuickCounterEnabled: false,
            hudQuickCounterPrimaryMode: HudQuickCounterModes.HandStack,
            hudQuickCounterSecondaryMode: HudQuickCounterModes.InventoryTotal,
            hudQuickCounterShowIcon: true,
            wailaColorTheme: WailaColorThemes.Default,
            wailaAnchor: WailaAnchorModes.TopMiddle,
            wailaHorizontalOffset: WailaOffsetModes.Center,
            wailaVerticalOffset: WailaOffsetModes.Center,
            wailaSizePreset: WailaSizePresets.Normal,
            wailaWidthMode: WailaWidthModes.Normal,
            wailaHeightMode: WailaHeightModes.Normal,
            wailaShowEntityRender: true,
            stateColumns: 1,
            tagColumns: 1,
            familyColumns: 1
        }),
        components: Object.freeze({
            namespace: VisibilityPolicies.Show,
            customFields: VisibilityPolicies.Show,
            customEnergyInfo: VisibilityPolicies.Show,
            customFluidInfo: VisibilityPolicies.Show,
            customGasInfo: VisibilityPolicies.Show,
            customRotationInfo: VisibilityPolicies.ShowWhenSneaking,
            customMachineProgress: VisibilityPolicies.ShowWhenSneaking,
            customCobblestoneCount: VisibilityPolicies.Show,
            customVariantPreview: VisibilityPolicies.ShowWhenSneaking,
            blockStates: VisibilityPolicies.Show,
            blockTags: VisibilityPolicies.ShowWhenSneaking,
            health: VisibilityPolicies.Show,
            absorption: VisibilityPolicies.Show,
            armor: VisibilityPolicies.Show,
            hunger: VisibilityPolicies.Show,
            hungerEffect: VisibilityPolicies.Show,
            airBubbles: VisibilityPolicies.Show,
            effects: VisibilityPolicies.Show,
            effectHearts: VisibilityPolicies.Show,
            frozenHearts: VisibilityPolicies.Show,
            animalHearts: VisibilityPolicies.Show,
            tameable: VisibilityPolicies.Show,
            tameFoods: VisibilityPolicies.ShowWhenSneaking,
            technical: VisibilityPolicies.Hide,
            coordinates: VisibilityPolicies.Hide,
            typeId: VisibilityPolicies.Hide,
            entityTags: VisibilityPolicies.Hide,
            entityFamilies: VisibilityPolicies.Hide,
            velocity: VisibilityPolicies.Hide,
            namespaceResolution: VisibilityPolicies.Hide
        })
    }),
    [InsightModes.Detailed]: Object.freeze({
        label: "Detailed",
        labelKey: "ui.dorios.insight.mode.detailed",
        runtime: Object.freeze({
            maxDistance: 9,
            updateIntervalTicks: 2,
            unchangedTargetRefreshTicks: 8,
            includeLiquidBlocks: false,
            includeInvisibleEntities: true,
            clearAfterNoTargetTicks: 30,
            linkedEntityScanIntervalTicks: 20,
            linkedEntityScanMaxDistance: 1.35,
            ignoreMachineHelperEntities: true,
            maxVisibleStates: 6,
            maxVisibleBlockTags: 6,
            maxVisibleEntityTags: 4,
            maxVisibleEntityFamilies: 4,
            maxVisibleEffects: 5,
            maxHeartDisplayHealth: 100,
            effectDisplayMode: EffectDisplayModes.Emoji,
            displayStyle: DisplayStyles.Icon,
            healthDisplayStyle: DisplayStyles.Icon,
            hungerDisplayStyle: DisplayStyles.Icon,
            armorDisplayStyle: DisplayStyles.Icon,
            absorptionDisplayStyle: DisplayStyles.Icon,
            airDisplayStyle: DisplayStyles.Icon,
            nameDisplayMode: EntityNameDisplayModes.NicknameFirst,
            nameResolveMode: EntityNameResolveModes.TranslationKeys,
            blockNameResolveMode: EntityNameResolveModes.TranslationKeys,
            namespaceDisplayMode: NamespaceDisplayModes.Name,
            villagerProfessionDisplay: VillagerProfessionDisplayModes.BelowName,
            toolTierIndicatorMode: ToolTierIndicatorModes.BooleanIndicator,
            toolIndicatorPlacement: ToolIndicatorPlacementModes.BeforeName,
            toolIndicatorColor: "§7",
            modePresetSummaryMode: ModePresetSummaryModes.SummaryAndChanged,
            hudHealthVisibilityMode: HudDisplayModes.ShowVanilla,
            hudHungerVisibilityMode: HudDisplayModes.ShowVanilla,
            hudSaturationVisibilityMode: HudDisplayModes.Both,
            hudToughnessVisibilityMode: HudDisplayModes.Both,
            hudHealthIndicatorMode: HudIndicatorModes.IconAndPoints,
            hudHungerIndicatorMode: HudIndicatorModes.IconAndPoints,
            hudInventoryEnabled: false,
            hudInventoryPosition: HudElementPositionModes.Center,
            hudInventoryDisplayMode: HudInventoryDisplayModes.Full,
            hudInventoryOrientation: HudElementOrientationModes.Horizontal,
            hudDurabilityDisplayMode: HudDurabilityDisplayModes.ValuesAndPercent,
            hudDurabilityPosition: HudDurabilityPositionModes.RightHotbar,
            hudDurabilityShowWhenFull: false,
            hudQuickCounterEnabled: false,
            hudQuickCounterPrimaryMode: HudQuickCounterModes.HandStack,
            hudQuickCounterSecondaryMode: HudQuickCounterModes.InventoryTotal,
            hudQuickCounterShowIcon: true,
            wailaColorTheme: WailaColorThemes.Default,
            wailaAnchor: WailaAnchorModes.TopMiddle,
            wailaHorizontalOffset: WailaOffsetModes.Center,
            wailaVerticalOffset: WailaOffsetModes.Center,
            wailaSizePreset: WailaSizePresets.Normal,
            wailaWidthMode: WailaWidthModes.Normal,
            wailaHeightMode: WailaHeightModes.Normal,
            wailaShowEntityRender: true,
            stateColumns: 1,
            tagColumns: 1,
            familyColumns: 1
        }),
        components: Object.freeze({
            namespace: VisibilityPolicies.Show,
            customFields: VisibilityPolicies.Show,
            customEnergyInfo: VisibilityPolicies.Show,
            customFluidInfo: VisibilityPolicies.Show,
            customGasInfo: VisibilityPolicies.Show,
            customRotationInfo: VisibilityPolicies.Show,
            customMachineProgress: VisibilityPolicies.Show,
            customCobblestoneCount: VisibilityPolicies.Show,
            customVariantPreview: VisibilityPolicies.Show,
            blockStates: VisibilityPolicies.Show,
            blockTags: VisibilityPolicies.ShowWhenSneaking,
            health: VisibilityPolicies.Show,
            absorption: VisibilityPolicies.Show,
            armor: VisibilityPolicies.Show,
            hunger: VisibilityPolicies.Show,
            hungerEffect: VisibilityPolicies.Show,
            airBubbles: VisibilityPolicies.Show,
            effects: VisibilityPolicies.Show,
            effectHearts: VisibilityPolicies.Show,
            frozenHearts: VisibilityPolicies.Show,
            animalHearts: VisibilityPolicies.Show,
            tameable: VisibilityPolicies.Show,
            tameFoods: VisibilityPolicies.Show,
            technical: VisibilityPolicies.ShowWhenSneaking,
            coordinates: VisibilityPolicies.ShowWhenSneaking,
            typeId: VisibilityPolicies.ShowWhenSneaking,
            entityTags: VisibilityPolicies.ShowWhenSneaking,
            entityFamilies: VisibilityPolicies.ShowWhenSneaking,
            velocity: VisibilityPolicies.ShowWhenSneaking,
            namespaceResolution: VisibilityPolicies.Hide
        })
    }),
    [InsightModes.Debug]: Object.freeze({
        label: "Debug",
        labelKey: "ui.dorios.insight.mode.debug",
        runtime: Object.freeze({
            maxDistance: 12,
            updateIntervalTicks: 1,
            unchangedTargetRefreshTicks: 6,
            includeLiquidBlocks: true,
            includeInvisibleEntities: true,
            clearAfterNoTargetTicks: 40,
            linkedEntityScanIntervalTicks: 20,
            linkedEntityScanMaxDistance: 1.35,
            ignoreMachineHelperEntities: true,
            maxVisibleStates: 12,
            maxVisibleBlockTags: 12,
            maxVisibleEntityTags: 12,
            maxVisibleEntityFamilies: 12,
            maxVisibleEffects: 8,
            maxHeartDisplayHealth: 100,
            effectDisplayMode: EffectDisplayModes.Emoji,
            displayStyle: DisplayStyles.Icon,
            healthDisplayStyle: DisplayStyles.Icon,
            hungerDisplayStyle: DisplayStyles.Icon,
            armorDisplayStyle: DisplayStyles.Icon,
            absorptionDisplayStyle: DisplayStyles.Icon,
            airDisplayStyle: DisplayStyles.Icon,
            nameDisplayMode: EntityNameDisplayModes.NicknameFirst,
            nameResolveMode: EntityNameResolveModes.TranslationKeys,
            blockNameResolveMode: EntityNameResolveModes.TranslationKeys,
            namespaceDisplayMode: NamespaceDisplayModes.Name,
            villagerProfessionDisplay: VillagerProfessionDisplayModes.BelowName,
            toolTierIndicatorMode: ToolTierIndicatorModes.BooleanIndicator,
            toolIndicatorPlacement: ToolIndicatorPlacementModes.BeforeName,
            toolIndicatorColor: "§7",
            modePresetSummaryMode: ModePresetSummaryModes.SummaryAndChanged,
            hudHealthVisibilityMode: HudDisplayModes.Both,
            hudHungerVisibilityMode: HudDisplayModes.Both,
            hudSaturationVisibilityMode: HudDisplayModes.Both,
            hudToughnessVisibilityMode: HudDisplayModes.Both,
            hudHealthIndicatorMode: HudIndicatorModes.IconAndPoints,
            hudHungerIndicatorMode: HudIndicatorModes.IconAndPoints,
            hudInventoryEnabled: false,
            hudInventoryPosition: HudElementPositionModes.Center,
            hudInventoryDisplayMode: HudInventoryDisplayModes.Full,
            hudInventoryOrientation: HudElementOrientationModes.Horizontal,
            hudDurabilityDisplayMode: HudDurabilityDisplayModes.ValuesAndPercent,
            hudDurabilityPosition: HudDurabilityPositionModes.RightHotbar,
            hudDurabilityShowWhenFull: false,
            hudQuickCounterEnabled: false,
            hudQuickCounterPrimaryMode: HudQuickCounterModes.HandStack,
            hudQuickCounterSecondaryMode: HudQuickCounterModes.InventoryTotal,
            hudQuickCounterShowIcon: true,
            wailaColorTheme: WailaColorThemes.Default,
            wailaAnchor: WailaAnchorModes.TopMiddle,
            wailaHorizontalOffset: WailaOffsetModes.Center,
            wailaVerticalOffset: WailaOffsetModes.Center,
            wailaSizePreset: WailaSizePresets.Normal,
            wailaWidthMode: WailaWidthModes.Normal,
            wailaHeightMode: WailaHeightModes.Normal,
            wailaShowEntityRender: true,
            stateColumns: 2,
            tagColumns: 2,
            familyColumns: 2
        }),
        components: Object.freeze({
            namespace: VisibilityPolicies.Show,
            customFields: VisibilityPolicies.Show,
            customEnergyInfo: VisibilityPolicies.Show,
            customFluidInfo: VisibilityPolicies.Show,
            customGasInfo: VisibilityPolicies.Show,
            customRotationInfo: VisibilityPolicies.Show,
            customMachineProgress: VisibilityPolicies.Show,
            customCobblestoneCount: VisibilityPolicies.Show,
            customVariantPreview: VisibilityPolicies.Show,
            blockStates: VisibilityPolicies.Show,
            blockTags: VisibilityPolicies.Show,
            health: VisibilityPolicies.Show,
            absorption: VisibilityPolicies.Show,
            armor: VisibilityPolicies.Show,
            hunger: VisibilityPolicies.Show,
            hungerEffect: VisibilityPolicies.Show,
            airBubbles: VisibilityPolicies.Show,
            effects: VisibilityPolicies.Show,
            effectHearts: VisibilityPolicies.Show,
            frozenHearts: VisibilityPolicies.Show,
            animalHearts: VisibilityPolicies.Show,
            tameable: VisibilityPolicies.Show,
            tameFoods: VisibilityPolicies.Show,
            technical: VisibilityPolicies.Show,
            coordinates: VisibilityPolicies.Show,
            typeId: VisibilityPolicies.Show,
            entityTags: VisibilityPolicies.Show,
            entityFamilies: VisibilityPolicies.Show,
            velocity: VisibilityPolicies.Show,
            namespaceResolution: VisibilityPolicies.Show
        })
    })
});

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function normalizeMode(mode) {
    const normalized = String(mode || "").trim().toLowerCase();
    return InsightModePresets[normalized] ? normalized : InsightConfig.system.defaultMode;
}

export function normalizeEffectDisplayMode(mode) {
    const normalized = String(mode || "").trim().toLowerCase();
    for (const option of EffectDisplayModeLabels) {
        if (option.key === normalized) {
            return normalized;
        }
    }

    return EffectDisplayModes.Emoji;
}

export function getEffectDisplayModeIndex(mode) {
    const normalized = normalizeEffectDisplayMode(mode);
    const index = EffectDisplayModeLabels.findIndex((option) => option.key === normalized);
    return index === -1 ? 0 : index;
}

export function normalizeDisplayStyle(style) {
    const normalized = String(style || "").trim().toLowerCase();

    if (normalized === DisplayStyles.Text) {
        return DisplayStyles.TextFull;
    }

    for (const option of DisplayStyleLabels) {
        if (option.key === normalized) {
            return normalized;
        }
    }

    return DisplayStyles.Icon;
}

export function getDisplayStyleIndex(style) {
    const normalized = normalizeDisplayStyle(style);
    const index = DisplayStyleLabels.findIndex((option) => option.key === normalized);
    return index === -1 ? 0 : index;
}

export function normalizeHudDisplayMode(mode) {
    const normalized = String(mode || "").trim().toLowerCase();
    for (const option of HudDisplayModeLabels) {
        if (option.key === normalized) {
            return normalized;
        }
    }

    return HudDisplayModes.Both;
}

export function getHudDisplayModeIndex(mode) {
    const normalized = normalizeHudDisplayMode(mode);
    const index = HudDisplayModeLabels.findIndex((option) => option.key === normalized);
    return index === -1 ? 0 : index;
}

export function normalizeHudIndicatorMode(mode) {
    const normalized = String(mode || "").trim().toLowerCase();

    if (normalized === "icon_and_indicator") {
        return HudIndicatorModes.IconAndHealthAmount;
    }

    if (normalized === "icon_and_vanilla_amount") {
        return HudIndicatorModes.IconAndHeartCount;
    }

    for (const option of HudIndicatorModeLabels) {
        if (option.key === normalized) {
            return normalized;
        }
    }

    return HudIndicatorModes.IconAndHealthAmount;
}

export function getHudIndicatorModeIndex(mode) {
    const normalized = normalizeHudIndicatorMode(mode);
    const index = HudIndicatorModeLabels.findIndex((option) => option.key === normalized);
    return index === -1 ? 0 : index;
}

export function getHudIndicatorModeNumericId(mode) {
    return getHudIndicatorModeIndex(mode);
}

export function normalizeHudElementPositionMode(mode) {
    const normalized = String(mode || "").trim().toLowerCase();
    for (const option of HudElementPositionModeLabels) {
        if (option.key === normalized) {
            return normalized;
        }
    }

    return HudElementPositionModes.Center;
}

export function getHudElementPositionModeIndex(mode) {
    const normalized = normalizeHudElementPositionMode(mode);
    const index = HudElementPositionModeLabels.findIndex((option) => option.key === normalized);
    return index === -1 ? 0 : index;
}

export function getHudElementPositionNumericId(mode) {
    return getHudElementPositionModeIndex(mode);
}

export function normalizeHudInventoryDisplayMode(mode) {
    const normalized = String(mode || "").trim().toLowerCase();
    for (const option of HudInventoryDisplayModeLabels) {
        if (option.key === normalized) {
            return normalized;
        }
    }

    return HudInventoryDisplayModes.Full;
}

export function getHudInventoryDisplayModeIndex(mode) {
    const normalized = normalizeHudInventoryDisplayMode(mode);
    const index = HudInventoryDisplayModeLabels.findIndex((option) => option.key === normalized);
    return index === -1 ? 0 : index;
}

export function getHudInventoryDisplayNumericId(mode) {
    return getHudInventoryDisplayModeIndex(mode);
}

export function normalizeHudElementOrientationMode(mode) {
    const normalized = String(mode || "").trim().toLowerCase();
    for (const option of HudElementOrientationModeLabels) {
        if (option.key === normalized) {
            return normalized;
        }
    }

    return HudElementOrientationModes.Horizontal;
}

export function getHudElementOrientationModeIndex(mode) {
    const normalized = normalizeHudElementOrientationMode(mode);
    const index = HudElementOrientationModeLabels.findIndex((option) => option.key === normalized);
    return index === -1 ? 0 : index;
}

export function getHudElementOrientationNumericId(mode) {
    return getHudElementOrientationModeIndex(mode);
}

export function normalizeWailaColorTheme(theme) {
    const normalized = String(theme || "").trim().toLowerCase();
    for (const option of WailaColorThemeLabels) {
        if (option.key === normalized) {
            return normalized;
        }
    }

    return WailaColorThemes.Default;
}

export function getWailaColorThemeIndex(theme) {
    const normalized = normalizeWailaColorTheme(theme);
    const index = WailaColorThemeLabels.findIndex((option) => option.key === normalized);
    return index === -1 ? 0 : index;
}

export function getWailaColorThemeNumericId(theme) {
    return getWailaColorThemeIndex(theme);
}

export function normalizeHudDurabilityDisplayMode(mode) {
    const normalized = String(mode || "").trim().toLowerCase();
    for (const option of HudDurabilityDisplayModeLabels) {
        if (option.key === normalized) {
            return normalized;
        }
    }

    return HudDurabilityDisplayModes.ValuesAndPercent;
}

export function getHudDurabilityDisplayModeIndex(mode) {
    const normalized = normalizeHudDurabilityDisplayMode(mode);
    const index = HudDurabilityDisplayModeLabels.findIndex((option) => option.key === normalized);
    return index === -1 ? 0 : index;
}

export function getHudDurabilityDisplayModeNumericId(mode) {
    return getHudDurabilityDisplayModeIndex(mode);
}

export function normalizeHudDurabilityPositionMode(mode) {
    const normalized = String(mode || "").trim().toLowerCase();
    for (const option of HudDurabilityPositionModeLabels) {
        if (option.key === normalized) {
            return normalized;
        }
    }

    return HudDurabilityPositionModes.RightHotbar;
}

export function getHudDurabilityPositionModeIndex(mode) {
    const normalized = normalizeHudDurabilityPositionMode(mode);
    const index = HudDurabilityPositionModeLabels.findIndex((option) => option.key === normalized);
    return index === -1 ? 0 : index;
}

export function getHudDurabilityPositionNumericId(mode) {
    return getHudDurabilityPositionModeIndex(mode);
}

export function normalizeHudQuickCounterMode(mode) {
    const normalized = String(mode || "").trim().toLowerCase();
    for (const option of HudQuickCounterModeLabels) {
        if (option.key === normalized) {
            return normalized;
        }
    }

    return HudQuickCounterModes.Hidden;
}

export function getHudQuickCounterModeIndex(mode) {
    const normalized = normalizeHudQuickCounterMode(mode);
    const index = HudQuickCounterModeLabels.findIndex((option) => option.key === normalized);
    return index === -1 ? 0 : index;
}

export function getHudQuickCounterModeNumericId(mode) {
    return getHudQuickCounterModeIndex(mode);
}

export function normalizeWailaAnchorMode(mode) {
    const normalized = String(mode || "").trim().toLowerCase();
    for (const option of WailaAnchorModeLabels) {
        if (option.key === normalized) {
            return normalized;
        }
    }

    return WailaAnchorModes.TopMiddle;
}

export function getWailaAnchorModeIndex(mode) {
    const normalized = normalizeWailaAnchorMode(mode);
    const index = WailaAnchorModeLabels.findIndex((option) => option.key === normalized);
    return index === -1 ? 0 : index;
}

export function getWailaAnchorNumericId(mode) {
    return getWailaAnchorModeIndex(mode);
}

export function normalizeWailaOffsetMode(mode) {
    const normalized = String(mode || "").trim().toLowerCase();
    for (const option of WailaHorizontalOffsetModeLabels) {
        if (option.key === normalized) {
            return normalized;
        }
    }

    return WailaOffsetModes.Center;
}

export function getWailaOffsetModeIndex(mode) {
    const normalized = normalizeWailaOffsetMode(mode);
    const index = WailaHorizontalOffsetModeLabels.findIndex((option) => option.key === normalized);
    return index === -1 ? 0 : index;
}

export function getWailaOffsetNumericId(mode) {
    return getWailaOffsetModeIndex(mode);
}

export function normalizeWailaSizePreset(mode) {
    const normalized = String(mode || "").trim().toLowerCase();
    for (const option of WailaSizePresetLabels) {
        if (option.key === normalized) {
            return normalized;
        }
    }

    return WailaSizePresets.Normal;
}

export function getWailaSizePresetIndex(mode) {
    const normalized = normalizeWailaSizePreset(mode);
    const index = WailaSizePresetLabels.findIndex((option) => option.key === normalized);
    return index === -1 ? 0 : index;
}

export function getWailaSizePresetNumericId(mode) {
    return getWailaSizePresetIndex(mode);
}

export function normalizeWailaWidthMode(mode) {
    const normalized = String(mode || "").trim().toLowerCase();
    for (const option of WailaWidthModeLabels) {
        if (option.key === normalized) {
            return normalized;
        }
    }

    return WailaWidthModes.Normal;
}

export function getWailaWidthModeIndex(mode) {
    const normalized = normalizeWailaWidthMode(mode);
    const index = WailaWidthModeLabels.findIndex((option) => option.key === normalized);
    return index === -1 ? 0 : index;
}

export function getWailaWidthModeNumericId(mode) {
    return getWailaWidthModeIndex(mode);
}

export function normalizeWailaHeightMode(mode) {
    const normalized = String(mode || "").trim().toLowerCase();
    for (const option of WailaHeightModeLabels) {
        if (option.key === normalized) {
            return normalized;
        }
    }

    return WailaHeightModes.Normal;
}

export function getWailaHeightModeIndex(mode) {
    const normalized = normalizeWailaHeightMode(mode);
    const index = WailaHeightModeLabels.findIndex((option) => option.key === normalized);
    return index === -1 ? 0 : index;
}

export function getWailaHeightModeNumericId(mode) {
    return getWailaHeightModeIndex(mode);
}

export function normalizeModePresetSummaryMode(mode) {
    const normalized = String(mode || "").trim().toLowerCase();
    for (const option of ModePresetSummaryModeLabels) {
        if (option.key === normalized) {
            return normalized;
        }
    }

    return ModePresetSummaryModes.SummaryAndChanged;
}

export function getModePresetSummaryModeIndex(mode) {
    const normalized = normalizeModePresetSummaryMode(mode);
    const index = ModePresetSummaryModeLabels.findIndex((option) => option.key === normalized);
    return index === -1 ? 0 : index;
}

export function normalizeEntityNameDisplayMode(mode) {
    const normalized = String(mode || "").trim().toLowerCase();
    for (const option of EntityNameDisplayModeLabels) {
        if (option.key === normalized) {
            return normalized;
        }
    }

    return EntityNameDisplayModes.NicknameFirst;
}

export function getEntityNameDisplayModeIndex(mode) {
    const normalized = normalizeEntityNameDisplayMode(mode);
    const index = EntityNameDisplayModeLabels.findIndex((option) => option.key === normalized);
    return index === -1 ? 0 : index;
}

export function normalizeEntityNameResolveMode(mode) {
    const normalized = String(mode || "").trim().toLowerCase();
    for (const option of EntityNameResolveModeLabels) {
        if (option.key === normalized) {
            return normalized;
        }
    }

    return EntityNameResolveModes.TranslationKeys;
}

export function getEntityNameResolveModeIndex(mode) {
    const normalized = normalizeEntityNameResolveMode(mode);
    const index = EntityNameResolveModeLabels.findIndex((option) => option.key === normalized);
    return index === -1 ? 0 : index;
}

export function normalizeNamespaceDisplayMode(mode) {
    const normalized = String(mode || "").trim().toLowerCase();
    for (const option of NamespaceDisplayModeLabels) {
        if (option.key === normalized) {
            return normalized;
        }
    }

    return NamespaceDisplayModes.Name;
}

export function getNamespaceDisplayModeIndex(mode) {
    const normalized = normalizeNamespaceDisplayMode(mode);
    const index = NamespaceDisplayModeLabels.findIndex((option) => option.key === normalized);
    return index === -1 ? 0 : index;
}

export function normalizeVillagerProfessionDisplayMode(mode) {
    const normalized = String(mode || "").trim().toLowerCase();
    for (const option of VillagerProfessionDisplayModeLabels) {
        if (option.key === normalized) {
            return normalized;
        }
    }

    return VillagerProfessionDisplayModes.BelowName;
}

export function getVillagerProfessionDisplayModeIndex(mode) {
    const normalized = normalizeVillagerProfessionDisplayMode(mode);
    const index = VillagerProfessionDisplayModeLabels.findIndex((option) => option.key === normalized);
    return index === -1 ? 0 : index;
}

export function normalizeToolTierIndicatorMode(mode) {
    const normalized = String(mode || "").trim().toLowerCase();
    for (const option of ToolTierIndicatorModeLabels) {
        if (option.key === normalized) {
            return normalized;
        }
    }

    return ToolTierIndicatorModes.BooleanIndicator;
}

export function getToolTierIndicatorModeIndex(mode) {
    const normalized = normalizeToolTierIndicatorMode(mode);
    const index = ToolTierIndicatorModeLabels.findIndex((option) => option.key === normalized);
    return index === -1 ? 0 : index;
}

export function normalizeToolIndicatorPlacementMode(mode) {
    const normalized = String(mode || "").trim().toLowerCase();
    for (const option of ToolIndicatorPlacementModeLabels) {
        if (option.key === normalized) {
            return normalized;
        }
    }

    return ToolIndicatorPlacementModes.BeforeName;
}

export function getToolIndicatorPlacementModeIndex(mode) {
    const normalized = normalizeToolIndicatorPlacementMode(mode);
    const index = ToolIndicatorPlacementModeLabels.findIndex((option) => option.key === normalized);
    return index === -1 ? 0 : index;
}

export function normalizeToolIndicatorColor(colorCode) {
    const normalized = String(colorCode || "").trim().toLowerCase();
    for (const option of ToolIndicatorColorOptions) {
        if (option.key.toLowerCase() === normalized) {
            return option.key;
        }
    }

    return "§7";
}

export function getToolIndicatorColorIndex(colorCode) {
    const normalized = normalizeToolIndicatorColor(colorCode);
    const index = ToolIndicatorColorOptions.findIndex((option) => option.key === normalized);
    return index === -1 ? 0 : index;
}

export function normalizeVisibilityPolicy(policy) {
    const normalized = String(policy || "").trim().toLowerCase();

    if (
        normalized === "sneaking_creative"
        || normalized === "creative_sneak"
        || normalized === "creative_sneaking"
        || normalized === "sneak+creative"
    ) {
        return VisibilityPolicies.SneakingAndCreative;
    }

    for (const option of VisibilityPolicyLabels) {
        if (option.key === normalized) {
            return normalized;
        }
    }

    return VisibilityPolicies.Show;
}

export function getVisibilityPolicyIndex(policy) {
    const normalized = normalizeVisibilityPolicy(policy);
    const index = VisibilityPolicyLabels.findIndex((option) => option.key === normalized);
    return index === -1 ? 0 : index;
}

function safeReadWorldDynamicProperty(key) {
    try {
        return world.getDynamicProperty(key);
    } catch {
        return undefined;
    }
}

function safeWriteWorldDynamicProperty(key, value) {
    try {
        world.setDynamicProperty(key, value);
        return true;
    } catch {
        return false;
    }
}

function safeReadPlayerDynamicProperty(player, key) {
    try {
        return player.getDynamicProperty(key);
    } catch {
        return undefined;
    }
}

function safeWritePlayerDynamicProperty(player, key, value) {
    try {
        player.setDynamicProperty(key, value);
        return true;
    } catch {
        return false;
    }
}

function hasPlayerTag(player, tag) {
    if (!player || !tag) {
        return false;
    }

    try {
        if (typeof player.hasTag === "function") {
            return player.hasTag(tag);
        }
    } catch {
        // Ignore tag read errors.
    }

    return false;
}

function addPlayerTag(player, tag) {
    if (!player || !tag || hasPlayerTag(player, tag)) {
        return false;
    }

    try {
        if (typeof player.addTag === "function") {
            return Boolean(player.addTag(tag));
        }
    } catch {
        // Ignore tag write errors.
    }

    return false;
}

function isPlayerOperator(player) {
    if (!player) {
        return false;
    }

    try {
        if (typeof player.isOp === "function") {
            return Boolean(player.isOp());
        }
    } catch {
        // Ignore extension errors.
    }

    try {
        if (typeof player.isOp === "boolean") {
            return player.isOp;
        }
    } catch {
        // Ignore extension errors.
    }

    return false;
}

function isTaggedAdminPlayer(player) {
    return hasPlayerTag(player, ADMIN_PLAYER_TAG) || hasPlayerTag(player, LEGACY_ADMIN_PLAYER_TAG);
}

function getOnlinePlayers() {
    try {
        const players = world.getAllPlayers();
        return Array.isArray(players) ? players : [];
    } catch {
        return [];
    }
}

function doesPlayerMatchIdentity(player, playerId, playerName) {
    if (!player) {
        return false;
    }

    const expectedId = String(playerId || "").trim();
    const expectedName = String(playerName || "").trim().toLowerCase();

    if (expectedId.length && player.id === expectedId) {
        return true;
    }

    return expectedName.length > 0 && String(player.name || "").trim().toLowerCase() === expectedName;
}

function normalizeRuntime(runtimeCandidate, presetRuntime) {
    const runtime = runtimeCandidate && typeof runtimeCandidate === "object" ? runtimeCandidate : {};

    return {
        maxDistance: clamp(
            Number.isFinite(runtime.maxDistance) ? runtime.maxDistance : presetRuntime.maxDistance,
            InsightConfig.system.minMaxDistance,
            InsightConfig.system.maxMaxDistance
        ),
        updateIntervalTicks: clamp(
            Number.isFinite(runtime.updateIntervalTicks) ? runtime.updateIntervalTicks : presetRuntime.updateIntervalTicks,
            InsightConfig.system.minUpdateIntervalTicks,
            InsightConfig.system.maxUpdateIntervalTicks
        ),
        unchangedTargetRefreshTicks: clamp(
            Number.isFinite(runtime.unchangedTargetRefreshTicks)
                ? runtime.unchangedTargetRefreshTicks
                : presetRuntime.unchangedTargetRefreshTicks,
            InsightConfig.system.minUnchangedTargetRefreshTicks,
            InsightConfig.system.maxUnchangedTargetRefreshTicks
        ),
        includeLiquidBlocks: typeof runtime.includeLiquidBlocks === "boolean"
            ? runtime.includeLiquidBlocks
            : presetRuntime.includeLiquidBlocks,
        includeInvisibleEntities: typeof runtime.includeInvisibleEntities === "boolean"
            ? runtime.includeInvisibleEntities
            : presetRuntime.includeInvisibleEntities,
        clearAfterNoTargetTicks: clamp(
            Number.isFinite(runtime.clearAfterNoTargetTicks) ? runtime.clearAfterNoTargetTicks : presetRuntime.clearAfterNoTargetTicks,
            InsightConfig.system.minClearAfterNoTargetTicks,
            InsightConfig.system.maxClearAfterNoTargetTicks
        ),
        linkedEntityScanIntervalTicks: clamp(
            Number.isFinite(runtime.linkedEntityScanIntervalTicks)
                ? runtime.linkedEntityScanIntervalTicks
                : presetRuntime.linkedEntityScanIntervalTicks,
            InsightConfig.system.minLinkedEntityScanIntervalTicks,
            InsightConfig.system.maxLinkedEntityScanIntervalTicks
        ),
        linkedEntityScanMaxDistance: clamp(
            Number.isFinite(runtime.linkedEntityScanMaxDistance)
                ? runtime.linkedEntityScanMaxDistance
                : presetRuntime.linkedEntityScanMaxDistance,
            InsightConfig.system.minLinkedEntityScanMaxDistance,
            InsightConfig.system.maxLinkedEntityScanMaxDistance
        ),
        ignoreMachineHelperEntities: typeof runtime.ignoreMachineHelperEntities === "boolean"
            ? runtime.ignoreMachineHelperEntities
            : presetRuntime.ignoreMachineHelperEntities,
        maxVisibleStates: clamp(
            Number.isFinite(runtime.maxVisibleStates) ? runtime.maxVisibleStates : presetRuntime.maxVisibleStates,
            0,
            InsightConfig.system.maxVisibleStatesCap
        ),
        maxVisibleBlockTags: clamp(
            Number.isFinite(runtime.maxVisibleBlockTags) ? runtime.maxVisibleBlockTags : presetRuntime.maxVisibleBlockTags,
            0,
            InsightConfig.system.maxVisibleTagsCap
        ),
        maxVisibleEntityTags: clamp(
            Number.isFinite(runtime.maxVisibleEntityTags) ? runtime.maxVisibleEntityTags : presetRuntime.maxVisibleEntityTags,
            0,
            InsightConfig.system.maxVisibleTagsCap
        ),
        maxVisibleEntityFamilies: clamp(
            Number.isFinite(runtime.maxVisibleEntityFamilies) ? runtime.maxVisibleEntityFamilies : presetRuntime.maxVisibleEntityFamilies,
            0,
            InsightConfig.system.maxVisibleFamiliesCap
        ),
        maxVisibleEffects: clamp(
            Number.isFinite(runtime.maxVisibleEffects) ? runtime.maxVisibleEffects : presetRuntime.maxVisibleEffects,
            0,
            InsightConfig.system.maxVisibleEffectsCap
        ),
        maxHeartDisplayHealth: clamp(
            Number.isFinite(runtime.maxHeartDisplayHealth) ? runtime.maxHeartDisplayHealth : presetRuntime.maxHeartDisplayHealth,
            InsightConfig.system.minMaxHeartDisplayHealth,
            InsightConfig.system.maxMaxHeartDisplayHealth
        ),
        effectDisplayMode: normalizeEffectDisplayMode(runtime.effectDisplayMode ?? presetRuntime.effectDisplayMode),
        displayStyle: normalizeDisplayStyle(runtime.displayStyle ?? presetRuntime.displayStyle),
        healthDisplayStyle: normalizeDisplayStyle(runtime.healthDisplayStyle ?? presetRuntime.healthDisplayStyle),
        hungerDisplayStyle: normalizeDisplayStyle(runtime.hungerDisplayStyle ?? presetRuntime.hungerDisplayStyle),
        armorDisplayStyle: normalizeDisplayStyle(runtime.armorDisplayStyle ?? presetRuntime.armorDisplayStyle),
        absorptionDisplayStyle: normalizeDisplayStyle(runtime.absorptionDisplayStyle ?? presetRuntime.absorptionDisplayStyle),
        airDisplayStyle: normalizeDisplayStyle(runtime.airDisplayStyle ?? presetRuntime.airDisplayStyle),
        nameDisplayMode: normalizeEntityNameDisplayMode(runtime.nameDisplayMode ?? presetRuntime.nameDisplayMode),
        nameResolveMode: normalizeEntityNameResolveMode(runtime.nameResolveMode ?? presetRuntime.nameResolveMode),
        blockNameResolveMode: normalizeEntityNameResolveMode(
            runtime.blockNameResolveMode ?? presetRuntime.blockNameResolveMode ?? presetRuntime.nameResolveMode
        ),
        namespaceDisplayMode: normalizeNamespaceDisplayMode(
            runtime.namespaceDisplayMode ?? presetRuntime.namespaceDisplayMode
        ),
        villagerProfessionDisplay: normalizeVillagerProfessionDisplayMode(
            runtime.villagerProfessionDisplay ?? presetRuntime.villagerProfessionDisplay
        ),
        toolTierIndicatorMode: normalizeToolTierIndicatorMode(runtime.toolTierIndicatorMode ?? presetRuntime.toolTierIndicatorMode),
        toolIndicatorPlacement: normalizeToolIndicatorPlacementMode(
            runtime.toolIndicatorPlacement ?? presetRuntime.toolIndicatorPlacement
        ),
        toolIndicatorColor: normalizeToolIndicatorColor(
            runtime.toolIndicatorColor ?? presetRuntime.toolIndicatorColor
        ),
        modePresetSummaryMode: normalizeModePresetSummaryMode(
            runtime.modePresetSummaryMode ?? presetRuntime.modePresetSummaryMode
        ),
        hudHealthVisibilityMode: normalizeHudDisplayMode(
            runtime.hudHealthVisibilityMode ?? presetRuntime.hudHealthVisibilityMode
        ),
        hudHungerVisibilityMode: normalizeHudDisplayMode(
            runtime.hudHungerVisibilityMode ?? presetRuntime.hudHungerVisibilityMode
        ),
        hudSaturationVisibilityMode: normalizeHudDisplayMode(
            runtime.hudSaturationVisibilityMode ?? presetRuntime.hudSaturationVisibilityMode
        ),
        hudToughnessVisibilityMode: normalizeHudDisplayMode(
            runtime.hudToughnessVisibilityMode ?? presetRuntime.hudToughnessVisibilityMode
        ),
        hudHealthIndicatorMode: normalizeHudIndicatorMode(
            runtime.hudHealthIndicatorMode ?? presetRuntime.hudHealthIndicatorMode
        ),
        hudHungerIndicatorMode: normalizeHudIndicatorMode(
            runtime.hudHungerIndicatorMode ?? presetRuntime.hudHungerIndicatorMode
        ),
        hudInventoryEnabled: typeof runtime.hudInventoryEnabled === "boolean"
            ? runtime.hudInventoryEnabled
            : presetRuntime.hudInventoryEnabled,
        hudInventoryPosition: normalizeHudElementPositionMode(
            runtime.hudInventoryPosition ?? presetRuntime.hudInventoryPosition
        ),
        hudInventoryDisplayMode: normalizeHudInventoryDisplayMode(
            runtime.hudInventoryDisplayMode ?? presetRuntime.hudInventoryDisplayMode
        ),
        hudInventoryOrientation: normalizeHudElementOrientationMode(
            runtime.hudInventoryOrientation ?? presetRuntime.hudInventoryOrientation
        ),
        hudDurabilityDisplayMode: normalizeHudDurabilityDisplayMode(
            runtime.hudDurabilityDisplayMode ?? presetRuntime.hudDurabilityDisplayMode
        ),
        hudDurabilityPosition: normalizeHudDurabilityPositionMode(
            runtime.hudDurabilityPosition ?? presetRuntime.hudDurabilityPosition
        ),
        hudDurabilityShowWhenFull: typeof runtime.hudDurabilityShowWhenFull === "boolean"
            ? runtime.hudDurabilityShowWhenFull
            : presetRuntime.hudDurabilityShowWhenFull,
        hudQuickCounterEnabled: typeof runtime.hudQuickCounterEnabled === "boolean"
            ? runtime.hudQuickCounterEnabled
            : presetRuntime.hudQuickCounterEnabled,
        hudQuickCounterPrimaryMode: normalizeHudQuickCounterMode(
            runtime.hudQuickCounterPrimaryMode ?? presetRuntime.hudQuickCounterPrimaryMode
        ),
        hudQuickCounterSecondaryMode: normalizeHudQuickCounterMode(
            runtime.hudQuickCounterSecondaryMode ?? presetRuntime.hudQuickCounterSecondaryMode
        ),
        hudQuickCounterShowIcon: typeof runtime.hudQuickCounterShowIcon === "boolean"
            ? runtime.hudQuickCounterShowIcon
            : presetRuntime.hudQuickCounterShowIcon,
        wailaColorTheme: normalizeWailaColorTheme(
            runtime.wailaColorTheme ?? presetRuntime.wailaColorTheme
        ),
        wailaAnchor: normalizeWailaAnchorMode(
            runtime.wailaAnchor ?? presetRuntime.wailaAnchor
        ),
        wailaHorizontalOffset: normalizeWailaOffsetMode(
            runtime.wailaHorizontalOffset ?? presetRuntime.wailaHorizontalOffset
        ),
        wailaVerticalOffset: normalizeWailaOffsetMode(
            runtime.wailaVerticalOffset ?? presetRuntime.wailaVerticalOffset
        ),
        wailaSizePreset: normalizeWailaSizePreset(
            runtime.wailaSizePreset ?? presetRuntime.wailaSizePreset
        ),
        wailaWidthMode: normalizeWailaWidthMode(
            runtime.wailaWidthMode ?? presetRuntime.wailaWidthMode
        ),
        wailaHeightMode: normalizeWailaHeightMode(
            runtime.wailaHeightMode ?? presetRuntime.wailaHeightMode
        ),
        wailaShowEntityRender: typeof runtime.wailaShowEntityRender === "boolean"
            ? runtime.wailaShowEntityRender
            : presetRuntime.wailaShowEntityRender,
        stateColumns: clamp(
            Number.isFinite(runtime.stateColumns) ? runtime.stateColumns : presetRuntime.stateColumns,
            1,
            InsightConfig.system.maxLayoutColumns
        ),
        tagColumns: clamp(
            Number.isFinite(runtime.tagColumns) ? runtime.tagColumns : presetRuntime.tagColumns,
            1,
            InsightConfig.system.maxLayoutColumns
        ),
        familyColumns: clamp(
            Number.isFinite(runtime.familyColumns) ? runtime.familyColumns : presetRuntime.familyColumns,
            1,
            InsightConfig.system.maxLayoutColumns
        )
    };
}

function normalizeComponents(componentCandidate, presetComponents) {
    const components = componentCandidate && typeof componentCandidate === "object" ? componentCandidate : {};
    const normalized = {};

    for (const definition of InsightComponentDefinitions) {
        const rawValue = components[definition.key];
        const resolvedPolicy = rawValue ? normalizeVisibilityPolicy(rawValue) : presetComponents[definition.key];
        normalized[definition.key] = isInsightComponentDeprecated(definition.key)
            ? VisibilityPolicies.Hide
            : resolvedPolicy;
    }

    return normalized;
}

function normalizePlayerOverrides(rawCandidate, preset) {
    const raw = rawCandidate && typeof rawCandidate === "object" ? rawCandidate : {};
    const modeOverride = raw.modeOverride ? normalizeMode(raw.modeOverride) : undefined;
    const disabled = typeof raw.disabled === "boolean" ? raw.disabled : false;

    return {
        modeOverride,
        disabled,
        runtime: normalizeRuntime(raw.runtime, preset.runtime),
        components: normalizeComponents(raw.components, preset.components)
    };
}

function getMemoryPlayerOverrides(player) {
    const key = player.id || player.name;
    if (!memoryFallback.playerSettings.has(key)) {
        memoryFallback.playerSettings.set(key, undefined);
    }
    return memoryFallback.playerSettings.get(key);
}

function setMemoryPlayerOverrides(player, overrides) {
    const key = player.id || player.name;
    memoryFallback.playerSettings.set(key, overrides);
}

export function getCurrentMode() {
    const storedValue = safeReadWorldDynamicProperty(WORLD_MODE_DYNAMIC_PROPERTY);
    if (typeof storedValue === "string") {
        const normalized = normalizeMode(storedValue);
        memoryFallback.mode = normalized;
        return normalized;
    }

    return memoryFallback.mode;
}

export function setCurrentMode(mode) {
    const normalized = normalizeMode(mode);
    memoryFallback.mode = normalized;
    safeWriteWorldDynamicProperty(WORLD_MODE_DYNAMIC_PROPERTY, normalized);
    return normalized;
}

export function isInsightGloballyEnabled() {
    const storedValue = safeReadWorldDynamicProperty(WORLD_ENABLED_DYNAMIC_PROPERTY);
    if (typeof storedValue === "boolean") {
        memoryFallback.enabled = storedValue;
        return storedValue;
    }

    return memoryFallback.enabled;
}

export function setInsightGlobalEnabled(isEnabled) {
    const normalized = Boolean(isEnabled);
    memoryFallback.enabled = normalized;
    safeWriteWorldDynamicProperty(WORLD_ENABLED_DYNAMIC_PROPERTY, normalized);
    return normalized;
}

export function getRecognizedHostId() {
    const storedValue = safeReadWorldDynamicProperty(WORLD_HOST_ID_DYNAMIC_PROPERTY);
    if (typeof storedValue === "string") {
        memoryFallback.hostId = storedValue;
        return storedValue;
    }

    return memoryFallback.hostId;
}

export function getRecognizedHostName() {
    const storedValue = safeReadWorldDynamicProperty(WORLD_HOST_NAME_DYNAMIC_PROPERTY);
    if (typeof storedValue === "string") {
        memoryFallback.hostName = storedValue;
        return storedValue;
    }

    return memoryFallback.hostName;
}

export function resolveRecognizedHostPlayer() {
    return findPlayerByIdOrName(getRecognizedHostId(), getRecognizedHostName());
}

export function isRecognizedHostPlayer(player) {
    return doesPlayerMatchIdentity(player, getRecognizedHostId(), getRecognizedHostName());
}

export function linkPlayerAdminTags(player) {
    if (!player) {
        return false;
    }

    const linkedAdminTag = addPlayerTag(player, ADMIN_PLAYER_TAG);
    const linkedLegacyTag = addPlayerTag(player, LEGACY_ADMIN_PLAYER_TAG);
    return linkedAdminTag || linkedLegacyTag || hasPlayerTag(player, ADMIN_PLAYER_TAG) || hasPlayerTag(player, LEGACY_ADMIN_PLAYER_TAG);
}

export function setRecognizedHostPlayer(player) {
    if (!player) {
        return false;
    }

    const hostId = String(player.id || "").trim();
    const hostName = String(player.name || "").trim();

    if (!hostId && !hostName) {
        return false;
    }

    memoryFallback.hostId = hostId;
    memoryFallback.hostName = hostName;
    safeWriteWorldDynamicProperty(WORLD_HOST_ID_DYNAMIC_PROPERTY, hostId);
    safeWriteWorldDynamicProperty(WORLD_HOST_NAME_DYNAMIC_PROPERTY, hostName);
    linkPlayerAdminTags(player);
    return true;
}

export function isAdminPlayer(player) {
    if (!player) {
        return false;
    }

    return isPlayerOperator(player) || isTaggedAdminPlayer(player) || isRecognizedHostPlayer(player);
}

export function syncPlayerAdministrativeAccess(player) {
    if (!player) {
        return {
            isAdmin: false,
            linkedTags: false,
            recognizedAsHost: false
        };
    }

    const players = getOnlinePlayers();
    const hasStoredHost = Boolean(getRecognizedHostId() || getRecognizedHostName());
    let recognizedAsHost = false;

    if (!hasStoredHost && (isPlayerOperator(player) || isTaggedAdminPlayer(player) || players.length <= 1)) {
        recognizedAsHost = setRecognizedHostPlayer(player);
    }

    const isAdmin = isAdminPlayer(player) || recognizedAsHost;
    const linkedTags = isAdmin ? linkPlayerAdminTags(player) : false;

    return {
        isAdmin,
        linkedTags,
        recognizedAsHost: recognizedAsHost || isRecognizedHostPlayer(player)
    };
}

export function isAdminOnlyGlobalProfileEnabled() {
    const storedValue = safeReadWorldDynamicProperty(WORLD_ADMIN_ONLY_DYNAMIC_PROPERTY);
    if (typeof storedValue === "boolean") {
        memoryFallback.adminOnly = storedValue;
        return storedValue;
    }

    return memoryFallback.adminOnly;
}

export function getAdminGlobalProfileSourceId() {
    const storedValue = safeReadWorldDynamicProperty(WORLD_ADMIN_SOURCE_ID_DYNAMIC_PROPERTY);
    if (typeof storedValue === "string") {
        memoryFallback.adminSourceId = storedValue;
        return storedValue;
    }

    return memoryFallback.adminSourceId;
}

export function getAdminGlobalProfileSourceName() {
    const storedValue = safeReadWorldDynamicProperty(WORLD_ADMIN_SOURCE_NAME_DYNAMIC_PROPERTY);
    if (typeof storedValue === "string") {
        memoryFallback.adminSourceName = storedValue;
        return storedValue;
    }

    return memoryFallback.adminSourceName;
}

function findPlayerByIdOrName(playerId, playerName) {
    const expectedId = String(playerId || "").trim();
    const expectedName = String(playerName || "").trim().toLowerCase();

    for (const onlinePlayer of getOnlinePlayers()) {
        if (expectedId.length && onlinePlayer.id === expectedId) {
            return onlinePlayer;
        }

        if (expectedName.length && String(onlinePlayer.name || "").toLowerCase() === expectedName) {
            return onlinePlayer;
        }
    }

    return undefined;
}

function findFirstOnlineAdmin() {
    for (const onlinePlayer of getOnlinePlayers()) {
        if (isAdminPlayer(onlinePlayer)) {
            return onlinePlayer;
        }
    }

    return undefined;
}

export function resolveAdminGlobalProfileSourcePlayer() {
    const sourceId = getAdminGlobalProfileSourceId();
    const sourceName = getAdminGlobalProfileSourceName();
    const explicitSource = findPlayerByIdOrName(sourceId, sourceName);
    if (explicitSource) {
        return explicitSource;
    }

    const recognizedHost = resolveRecognizedHostPlayer();
    if (recognizedHost) {
        return recognizedHost;
    }

    return findFirstOnlineAdmin();
}

export function setAdminOnlyGlobalProfileEnabled(isEnabled, sourcePlayer) {
    const normalized = Boolean(isEnabled);
    memoryFallback.adminOnly = normalized;
    safeWriteWorldDynamicProperty(WORLD_ADMIN_ONLY_DYNAMIC_PROPERTY, normalized);

    if (!normalized) {
        memoryFallback.adminSourceId = "";
        memoryFallback.adminSourceName = "";
        safeWriteWorldDynamicProperty(WORLD_ADMIN_SOURCE_ID_DYNAMIC_PROPERTY, "");
        safeWriteWorldDynamicProperty(WORLD_ADMIN_SOURCE_NAME_DYNAMIC_PROPERTY, "");
        return normalized;
    }

    const source = sourcePlayer || resolveAdminGlobalProfileSourcePlayer();
    const sourceId = String(source?.id || "").trim();
    const sourceName = String(source?.name || "").trim();

    memoryFallback.adminSourceId = sourceId;
    memoryFallback.adminSourceName = sourceName;
    safeWriteWorldDynamicProperty(WORLD_ADMIN_SOURCE_ID_DYNAMIC_PROPERTY, sourceId);
    safeWriteWorldDynamicProperty(WORLD_ADMIN_SOURCE_NAME_DYNAMIC_PROPERTY, sourceName);

    return normalized;
}

export function getModePreset(mode) {
    const normalized = normalizeMode(mode);
    return InsightModePresets[normalized];
}

export function getCurrentModeLabel() {
    const mode = getCurrentMode();
    return getModePreset(mode).label;
}

export function getPlayerOverrides(player, mode) {
    const activeMode = normalizeMode(mode || getCurrentMode());
    const preset = getModePreset(activeMode);
    const memoryValue = getMemoryPlayerOverrides(player);

    const stored = safeReadPlayerDynamicProperty(player, PLAYER_SETTINGS_DYNAMIC_PROPERTY);
    if (typeof stored === "string") {
        try {
            const parsed = JSON.parse(stored);
            const normalized = normalizePlayerOverrides(parsed, preset);
            setMemoryPlayerOverrides(player, normalized);
            return normalized;
        } catch {
            // Fallback to memory/default values.
        }
    }

    if (memoryValue) {
        return normalizePlayerOverrides(memoryValue, preset);
    }

    const defaults = normalizePlayerOverrides({}, preset);
    setMemoryPlayerOverrides(player, defaults);
    return defaults;
}

function persistPlayerOverrides(player, overrides) {
    setMemoryPlayerOverrides(player, overrides);
    const serialized = JSON.stringify(overrides);
    safeWritePlayerDynamicProperty(player, PLAYER_SETTINGS_DYNAMIC_PROPERTY, serialized);
}

export function updatePlayerOverrides(player, patch) {
    const mode = getCurrentMode();
    const preset = getModePreset(mode);
    const current = getPlayerOverrides(player, mode);

    const merged = {
        modeOverride: patch?.modeOverride !== undefined
            ? (patch.modeOverride ? normalizeMode(patch.modeOverride) : undefined)
            : current.modeOverride,
        disabled: patch?.disabled !== undefined ? Boolean(patch.disabled) : current.disabled,
        runtime: {
            ...current.runtime,
            ...(patch?.runtime || {})
        },
        components: {
            ...current.components,
            ...(patch?.components || {})
        }
    };

    const normalized = normalizePlayerOverrides(merged, preset);
    persistPlayerOverrides(player, normalized);
    return normalized;
}

export function resetPlayerOverrides(player) {
    const mode = getCurrentMode();
    const preset = getModePreset(mode);
    const defaults = normalizePlayerOverrides({}, preset);
    persistPlayerOverrides(player, defaults);
    return defaults;
}

export function setPlayerActivation(player, isActive) {
    return updatePlayerOverrides(player, { disabled: !isActive });
}

function isCreativePlayer(player) {
    try {
        if (typeof player.isInCreative === "function") {
            return Boolean(player.isInCreative());
        }

        if (typeof player.isInCreative === "boolean") {
            return player.isInCreative;
        }
    } catch {
        // Ignore extension errors.
    }

    try {
        if (typeof player.getGameMode === "function") {
            const rawMode = player.getGameMode();
            if (typeof rawMode === "string") {
                return rawMode.toLowerCase() === "creative";
            }

            if (rawMode && typeof rawMode === "object") {
                const modeId = rawMode.id ?? rawMode.value;
                if (typeof modeId === "string") {
                    return modeId.toLowerCase() === "creative";
                }
            }

            return String(rawMode).toLowerCase() === "creative";
        }
    } catch {
        // Fallback below.
    }

    return false;
}

function isPlayerSneaking(player) {
    try {
        if (typeof player.isSneaking === "function") {
            return Boolean(player.isSneaking());
        }

        if (typeof player.isSneaking === "boolean") {
            return player.isSneaking;
        }
    } catch {
        // Ignore extension errors.
    }

    return false;
}

function evaluateVisibilityPolicy(policy, context) {
    const normalized = normalizeVisibilityPolicy(policy);

    switch (normalized) {
        case VisibilityPolicies.Show:
            return true;
        case VisibilityPolicies.ShowWhenSneaking:
            return context.isSneaking;
        case VisibilityPolicies.CreativeOnly:
            return context.isCreative;
        case VisibilityPolicies.SneakingAndCreative:
            return context.isSneaking && context.isCreative;
        case VisibilityPolicies.Hide:
        default:
            return false;
    }
}

function isHudInsightVisible(mode) {
    const normalized = normalizeHudDisplayMode(mode);
    return normalized === HudDisplayModes.ShowInsight || normalized === HudDisplayModes.Both;
}

function isHudVanillaVisible(mode) {
    const normalized = normalizeHudDisplayMode(mode);
    return normalized === HudDisplayModes.ShowVanilla || normalized === HudDisplayModes.Both;
}

export function getPlayerDisplaySettings(player) {
    const tags = new Set(player.getTags ? player.getTags() : []);
    const isSneaking = isPlayerSneaking(player);
    const isCreative = isCreativePlayer(player);
    const globalEnabled = isInsightGloballyEnabled();
    const adminOnlyGlobalProfile = isAdminOnlyGlobalProfileEnabled();
    const adminSourcePlayer = adminOnlyGlobalProfile ? resolveAdminGlobalProfileSourcePlayer() : undefined;
    const adminSourceName = adminSourcePlayer?.name || getAdminGlobalProfileSourceName();

    const globalMode = getCurrentMode();
    const localOverrides = getPlayerOverrides(player, globalMode);
    const activeOverrides = adminOnlyGlobalProfile && adminSourcePlayer
        ? getPlayerOverrides(adminSourcePlayer, globalMode)
        : localOverrides;
    const activeMode = normalizeMode(activeOverrides.modeOverride || globalMode);
    const preset = getModePreset(activeMode);

    const runtime = normalizeRuntime(activeOverrides.runtime, preset.runtime);
    const components = normalizeComponents(activeOverrides.components, preset.components);
    const showHudHealthInsight = isHudInsightVisible(runtime.hudHealthVisibilityMode);
    const showHudHungerInsight = isHudInsightVisible(runtime.hudHungerVisibilityMode);
    const showHudSaturationInsight = isHudInsightVisible(runtime.hudSaturationVisibilityMode);
    const showHudToughnessInsight = isHudInsightVisible(runtime.hudToughnessVisibilityMode);
    const showHudHealthVanilla = isHudVanillaVisible(runtime.hudHealthVisibilityMode);
    const showHudHungerVanilla = isHudVanillaVisible(runtime.hudHungerVisibilityMode)
        && isHudVanillaVisible(runtime.hudSaturationVisibilityMode);
    const showHudArmorVanilla = isHudVanillaVisible(runtime.hudToughnessVisibilityMode);
    const hudHealthIndicatorEnabled = showHudHealthInsight
        && runtime.hudHealthIndicatorMode !== HudIndicatorModes.Hidden;
    const hudHungerIndicatorEnabled = showHudHungerInsight
        && runtime.hudHungerIndicatorMode !== HudIndicatorModes.Hidden;
    const hudInventoryEnabled = Boolean(runtime.hudInventoryEnabled);

    // Legacy compatibility via tags.
    if (tags.has(InsightConfig.playerTags.hideNamespace)) {
        components.namespace = VisibilityPolicies.Hide;
    }
    if (tags.has(InsightConfig.playerTags.hideHealth)) {
        components.health = VisibilityPolicies.Hide;
    }
    if (tags.has(InsightConfig.playerTags.technicalView)) {
        components.technical = VisibilityPolicies.Show;
    }
    if (tags.has(InsightConfig.playerTags.blockTags)) {
        components.blockTags = VisibilityPolicies.Show;
    }
    if (tags.has(InsightConfig.playerTags.hideBlockTags)) {
        components.blockTags = VisibilityPolicies.Hide;
    }
    if (tags.has(InsightConfig.playerTags.namespaceDebug)) {
        components.namespaceResolution = VisibilityPolicies.Show;
    }

    const visibilityContext = { isSneaking, isCreative };

    return {
        mode: activeMode,
        modeLabel: preset.label,
        globalEnabled,
        adminOnlyGlobalProfile,
        adminGlobalProfileSourceName: adminSourceName,
        disabled: !globalEnabled
            || (adminOnlyGlobalProfile && adminSourcePlayer ? false : localOverrides.disabled)
            || tags.has(InsightConfig.playerTags.disabled),
        requireSneak: tags.has(InsightConfig.playerTags.sneakOnly),
        isSneaking,
        isCreative,
        runtime,
        components,
        maxDistance: runtime.maxDistance,
        updateIntervalTicks: runtime.updateIntervalTicks,
        unchangedTargetRefreshTicks: runtime.unchangedTargetRefreshTicks,
        includeLiquidBlocks: runtime.includeLiquidBlocks,
        includeInvisibleEntities: runtime.includeInvisibleEntities,
        clearAfterNoTargetTicks: runtime.clearAfterNoTargetTicks,
        linkedEntityScanIntervalTicks: runtime.linkedEntityScanIntervalTicks,
        linkedEntityScanMaxDistance: runtime.linkedEntityScanMaxDistance,
        ignoreMachineHelperEntities: runtime.ignoreMachineHelperEntities,
        maxVisibleStates: runtime.maxVisibleStates,
        maxVisibleBlockTags: runtime.maxVisibleBlockTags,
        maxVisibleEntityTags: runtime.maxVisibleEntityTags,
        maxVisibleEntityFamilies: runtime.maxVisibleEntityFamilies,
        maxVisibleEffects: runtime.maxVisibleEffects,
        maxHeartDisplayHealth: runtime.maxHeartDisplayHealth,
        effectDisplayMode: runtime.effectDisplayMode,
        displayStyle: runtime.displayStyle,
        healthDisplayStyle: runtime.healthDisplayStyle,
        hungerDisplayStyle: runtime.hungerDisplayStyle,
        armorDisplayStyle: runtime.armorDisplayStyle,
        absorptionDisplayStyle: runtime.absorptionDisplayStyle,
        airDisplayStyle: runtime.airDisplayStyle,
        nameDisplayMode: runtime.nameDisplayMode,
        nameResolveMode: runtime.nameResolveMode,
        blockNameResolveMode: runtime.blockNameResolveMode,
        namespaceDisplayMode: runtime.namespaceDisplayMode,
        villagerProfessionDisplay: runtime.villagerProfessionDisplay,
        toolTierIndicatorMode: runtime.toolTierIndicatorMode,
        toolIndicatorPlacement: runtime.toolIndicatorPlacement,
        toolIndicatorColor: runtime.toolIndicatorColor,
        modePresetSummaryMode: runtime.modePresetSummaryMode,
        hudHealthVisibilityMode: runtime.hudHealthVisibilityMode,
        hudHungerVisibilityMode: runtime.hudHungerVisibilityMode,
        hudSaturationVisibilityMode: runtime.hudSaturationVisibilityMode,
        hudToughnessVisibilityMode: runtime.hudToughnessVisibilityMode,
        hudHealthIndicatorMode: runtime.hudHealthIndicatorMode,
        hudHealthIndicatorModeId: getHudIndicatorModeNumericId(runtime.hudHealthIndicatorMode),
        hudHungerIndicatorMode: runtime.hudHungerIndicatorMode,
        hudHungerIndicatorModeId: getHudIndicatorModeNumericId(runtime.hudHungerIndicatorMode),
        hudInventoryEnabled,
        hudInventoryPosition: runtime.hudInventoryPosition,
        hudInventoryDisplayMode: runtime.hudInventoryDisplayMode,
        hudInventoryOrientation: runtime.hudInventoryOrientation,
        hudDurabilityDisplayMode: runtime.hudDurabilityDisplayMode,
        hudDurabilityDisplayModeId: getHudDurabilityDisplayModeNumericId(runtime.hudDurabilityDisplayMode),
        hudDurabilityPosition: runtime.hudDurabilityPosition,
        hudDurabilityPositionId: getHudDurabilityPositionNumericId(runtime.hudDurabilityPosition),
        hudDurabilityShowWhenFull: Boolean(runtime.hudDurabilityShowWhenFull),
        hudQuickCounterEnabled: Boolean(runtime.hudQuickCounterEnabled),
        hudQuickCounterPrimaryMode: runtime.hudQuickCounterPrimaryMode,
        hudQuickCounterPrimaryModeId: getHudQuickCounterModeNumericId(runtime.hudQuickCounterPrimaryMode),
        hudQuickCounterSecondaryMode: runtime.hudQuickCounterSecondaryMode,
        hudQuickCounterSecondaryModeId: getHudQuickCounterModeNumericId(runtime.hudQuickCounterSecondaryMode),
        hudQuickCounterShowIcon: Boolean(runtime.hudQuickCounterShowIcon),
        wailaColorTheme: runtime.wailaColorTheme,
        wailaColorThemeId: getWailaColorThemeNumericId(runtime.wailaColorTheme),
        wailaAnchor: runtime.wailaAnchor,
        wailaAnchorId: getWailaAnchorNumericId(runtime.wailaAnchor),
        wailaHorizontalOffset: runtime.wailaHorizontalOffset,
        wailaHorizontalOffsetId: getWailaOffsetNumericId(runtime.wailaHorizontalOffset),
        wailaVerticalOffset: runtime.wailaVerticalOffset,
        wailaVerticalOffsetId: getWailaOffsetNumericId(runtime.wailaVerticalOffset),
        wailaSizePreset: runtime.wailaSizePreset,
        wailaSizePresetId: getWailaSizePresetNumericId(runtime.wailaSizePreset),
        wailaWidthMode: runtime.wailaWidthMode,
        wailaWidthModeId: getWailaWidthModeNumericId(runtime.wailaWidthMode),
        wailaHeightMode: runtime.wailaHeightMode,
        wailaHeightModeId: getWailaHeightModeNumericId(runtime.wailaHeightMode),
        wailaShowEntityRender: Boolean(runtime.wailaShowEntityRender),
        showHudHealthInsight,
        showHudHungerInsight,
        showHudSaturationInsight,
        showHudToughnessInsight,
        showHudHealthVanilla,
        showHudHungerVanilla,
        showHudArmorVanilla,
        hudHealthIndicatorEnabled,
        hudHungerIndicatorEnabled,
        showSaturation: showHudSaturationInsight,
        showExhaustion: showHudSaturationInsight,
        showToughness: showHudToughnessInsight,
        showExtraArmor: showHudToughnessInsight,
        stateColumns: runtime.stateColumns,
        tagColumns: runtime.tagColumns,
        familyColumns: runtime.familyColumns,
        showNamespace: evaluateVisibilityPolicy(components.namespace, visibilityContext),
        showCustomFields: evaluateVisibilityPolicy(components.customFields, visibilityContext),
        showCustomEnergyInfo: evaluateVisibilityPolicy(components.customEnergyInfo, visibilityContext),
        showCustomFluidInfo: evaluateVisibilityPolicy(components.customFluidInfo, visibilityContext),
        showCustomGasInfo: evaluateVisibilityPolicy(components.customGasInfo, visibilityContext),
        showCustomRotationInfo: evaluateVisibilityPolicy(components.customRotationInfo, visibilityContext),
        showCustomMachineProgress: evaluateVisibilityPolicy(components.customMachineProgress, visibilityContext),
        showCustomCobblestoneCount: evaluateVisibilityPolicy(components.customCobblestoneCount, visibilityContext),
        showCustomVariantPreview: evaluateVisibilityPolicy(components.customVariantPreview, visibilityContext),
        showBlockStates: evaluateVisibilityPolicy(components.blockStates, visibilityContext),
        showBlockTags: evaluateVisibilityPolicy(components.blockTags, visibilityContext),
        showHealth: evaluateVisibilityPolicy(components.health, visibilityContext),
        showAbsorption: evaluateVisibilityPolicy(components.absorption, visibilityContext),
        showArmor: evaluateVisibilityPolicy(components.armor, visibilityContext),
        showHunger: evaluateVisibilityPolicy(components.hunger, visibilityContext),
        showHungerEffect: evaluateVisibilityPolicy(components.hungerEffect, visibilityContext),
        showAirBubbles: evaluateVisibilityPolicy(components.airBubbles, visibilityContext),
        showEffects: evaluateVisibilityPolicy(components.effects, visibilityContext),
        showEffectHearts: evaluateVisibilityPolicy(components.effectHearts, visibilityContext),
        showFrozenHearts: false,
        showAnimalHearts: evaluateVisibilityPolicy(components.animalHearts, visibilityContext),
        showTameable: evaluateVisibilityPolicy(components.tameable, visibilityContext),
        showTameFoods: evaluateVisibilityPolicy(components.tameFoods, visibilityContext),
        showTechnicalData: evaluateVisibilityPolicy(components.technical, visibilityContext),
        showCoordinates: evaluateVisibilityPolicy(components.coordinates, visibilityContext),
        showTypeId: evaluateVisibilityPolicy(components.typeId, visibilityContext),
        showEntityTags: evaluateVisibilityPolicy(components.entityTags, visibilityContext),
        showEntityFamilies: evaluateVisibilityPolicy(components.entityFamilies, visibilityContext),
        showVelocity: evaluateVisibilityPolicy(components.velocity, visibilityContext),
        showNamespaceResolutionDebug: evaluateVisibilityPolicy(components.namespaceResolution, visibilityContext)
    };
}
