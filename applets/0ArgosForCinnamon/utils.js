let XletMeta;

// Mark for deletion on EOL. Cinnamon 3.6.x+
if (typeof __meta === "object") {
    XletMeta = __meta;
} else {
    XletMeta = imports.ui.appletManager.appletMeta["{{UUID}}"];
}

const Clutter = imports.gi.Clutter;
const GdkPixbuf = imports.gi.GdkPixbuf;
const Gettext = imports.gettext;
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const Lang = imports.lang;
const Main = imports.ui.main;
const MessageTray = imports.ui.messageTray;
const Pango = imports.gi.Pango;
const PopupMenu = imports.ui.popupMenu;
const St = imports.gi.St;
const Tooltips = imports.ui.tooltips;
const Util = imports.misc.util;

const CINNAMON_VERSION = GLib.getenv("CINNAMON_VERSION");
const CINN_2_8 = versionCompare(CINNAMON_VERSION, "2.8.8") <= 0;
const ANSI_COLORS = ["black", "red", "green", "yellow", "blue", "magenta", "cyan", "white"];

const OrnamentType = {
    NONE: 0,
    CHECK: 1,
    DOT: 2,
    ICON: 3
};

const NotificationUrgency = {
    LOW: 0,
    NORMAL: 1,
    HIGH: 2,
    CRITICAL: 3
};

Gettext.bindtextdomain(XletMeta.uuid, GLib.get_home_dir() + "/.local/share/locale");

function _(aStr) {
    let customTrans = Gettext.dgettext(XletMeta.uuid, aStr);

    if (customTrans !== aStr && aStr !== "") {
        return customTrans;
    }

    return Gettext.gettext(aStr);
}

function ngettext(aSingular, aPlural, aN) {
    let customTrans = Gettext.dngettext(XletMeta.uuid, aSingular, aPlural, aN);

    if (aN === 1) {
        if (customTrans !== aSingular) {
            return customTrans;
        }
    } else {
        if (customTrans !== aPlural) {
            return customTrans;
        }
    }

    return Gettext.ngettext(aSingular, aPlural, aN);
}

function getUnitPluralForm(aUnit, aN) {
    switch (aUnit) {
        case "ms":
            return ngettext("millisecond", "milliseconds", aN);
        case "s":
            return ngettext("second", "seconds", aN);
        case "m":
            return ngettext("minute", "minutes", aN);
        case "h":
            return ngettext("hour", "hours", aN);
        case "d":
            return ngettext("day", "days", aN);
    }

    return "";
}

const SLIDER_SCALE = 0.00025;

const UNITS_MAP = {
    s: {
        capital: _("Seconds")
    },
    m: {
        capital: _("Minutes")
    },
    h: {
        capital: _("Hours")
    },
    d: {
        capital: _("Days")
    }
};

// Source: https://github.com/muan/emojilib

const Emojis = {
    "100": "💯",
    "1234": "🔢",
    "grinning": "😀",
    "grimacing": "😬",
    "grin": "😁",
    "joy": "😂",
    "rofl": "🤣",
    "smiley": "😃",
    "smile": "😄",
    "sweat_smile": "😅",
    "laughing": "😆",
    "innocent": "😇",
    "wink": "😉",
    "blush": "😊",
    "slightly_smiling_face": "🙂",
    "upside_down_face": "🙃",
    "relaxed": "☺️",
    "yum": "😋",
    "relieved": "😌",
    "heart_eyes": "😍",
    "kissing_heart": "😘",
    "kissing": "😗",
    "kissing_smiling_eyes": "😙",
    "kissing_closed_eyes": "😚",
    "stuck_out_tongue_winking_eye": "😜",
    "zany": "🤪",
    "raised_eyebrow": "🤨",
    "monocle": "🧐",
    "stuck_out_tongue_closed_eyes": "😝",
    "stuck_out_tongue": "😛",
    "money_mouth_face": "🤑",
    "nerd_face": "🤓",
    "sunglasses": "😎",
    "star_struck": "🤩",
    "clown_face": "🤡",
    "cowboy_hat_face": "🤠",
    "hugs": "🤗",
    "smirk": "😏",
    "no_mouth": "😶",
    "neutral_face": "😐",
    "expressionless": "😑",
    "unamused": "😒",
    "roll_eyes": "🙄",
    "thinking": "🤔",
    "lying_face": "🤥",
    "hand_over_mouth": "🤭",
    "shushing": "🤫",
    "symbols_over_mouth": "🤬",
    "exploding_head": "🤯",
    "flushed": "😳",
    "disappointed": "😞",
    "worried": "😟",
    "angry": "😠",
    "rage": "😡",
    "pensive": "😔",
    "confused": "😕",
    "slightly_frowning_face": "🙁",
    "frowning_face": "☹",
    "persevere": "😣",
    "confounded": "😖",
    "tired_face": "😫",
    "weary": "😩",
    "triumph": "😤",
    "open_mouth": "😮",
    "scream": "😱",
    "fearful": "😨",
    "cold_sweat": "😰",
    "hushed": "😯",
    "frowning": "😦",
    "anguished": "😧",
    "cry": "😢",
    "disappointed_relieved": "😥",
    "drooling_face": "🤤",
    "sleepy": "😪",
    "sweat": "😓",
    "sob": "😭",
    "dizzy_face": "😵",
    "astonished": "😲",
    "zipper_mouth_face": "🤐",
    "nauseated_face": "🤢",
    "sneezing_face": "🤧",
    "vomiting": "🤮",
    "mask": "😷",
    "face_with_thermometer": "🤒",
    "face_with_head_bandage": "🤕",
    "sleeping": "😴",
    "zzz": "💤",
    "poop": "💩",
    "smiling_imp": "😈",
    "imp": "👿",
    "japanese_ogre": "👹",
    "japanese_goblin": "👺",
    "skull": "💀",
    "ghost": "👻",
    "alien": "👽",
    "robot": "🤖",
    "smiley_cat": "😺",
    "smile_cat": "😸",
    "joy_cat": "😹",
    "heart_eyes_cat": "😻",
    "smirk_cat": "😼",
    "kissing_cat": "😽",
    "scream_cat": "🙀",
    "crying_cat_face": "😿",
    "pouting_cat": "😾",
    "palms_up": "🤲",
    "raised_hands": "🙌",
    "clap": "👏",
    "wave": "👋",
    "call_me_hand": "🤙",
    "+1": "👍",
    "-1": "👎",
    "facepunch": "👊",
    "fist": "✊",
    "fist_left": "🤛",
    "fist_right": "🤜",
    "v": "✌",
    "ok_hand": "👌",
    "raised_hand": "✋",
    "raised_back_of_hand": "🤚",
    "open_hands": "👐",
    "muscle": "💪",
    "pray": "🙏",
    "handshake": "🤝",
    "point_up": "☝",
    "point_up_2": "👆",
    "point_down": "👇",
    "point_left": "👈",
    "point_right": "👉",
    "fu": "🖕",
    "raised_hand_with_fingers_splayed": "🖐",
    "love_you": "🤟",
    "metal": "🤘",
    "crossed_fingers": "🤞",
    "vulcan_salute": "🖖",
    "writing_hand": "✍",
    "selfie": "🤳",
    "nail_care": "💅",
    "lips": "👄",
    "tongue": "👅",
    "ear": "👂",
    "nose": "👃",
    "eye": "👁",
    "eyes": "👀",
    "brain": "🧠",
    "bust_in_silhouette": "👤",
    "busts_in_silhouette": "👥",
    "speaking_head": "🗣",
    "baby": "👶",
    "child": "🧒",
    "boy": "👦",
    "girl": "👧",
    "adult": "🧑",
    "man": "👨",
    "woman": "👩",
    "blonde_woman": "👱‍♀️",
    "blonde_man": "👱",
    "bearded_person": "🧔",
    "older_adult": "🧓",
    "older_man": "👴",
    "older_woman": "👵",
    "man_with_gua_pi_mao": "👲",
    "woman_with_headscarf": "🧕",
    "woman_with_turban": "👳‍♀️",
    "man_with_turban": "👳",
    "policewoman": "👮‍♀️",
    "policeman": "👮",
    "construction_worker_woman": "👷‍♀️",
    "construction_worker_man": "👷",
    "guardswoman": "💂‍♀️",
    "guardsman": "💂",
    "female_detective": "🕵️‍♀️",
    "male_detective": "🕵",
    "woman_health_worker": "👩‍⚕️",
    "man_health_worker": "👨‍⚕️",
    "woman_farmer": "👩‍🌾",
    "man_farmer": "👨‍🌾",
    "woman_cook": "👩‍🍳",
    "man_cook": "👨‍🍳",
    "woman_student": "👩‍🎓",
    "man_student": "👨‍🎓",
    "woman_singer": "👩‍🎤",
    "man_singer": "👨‍🎤",
    "woman_teacher": "👩‍🏫",
    "man_teacher": "👨‍🏫",
    "woman_factory_worker": "👩‍🏭",
    "man_factory_worker": "👨‍🏭",
    "woman_technologist": "👩‍💻",
    "man_technologist": "👨‍💻",
    "woman_office_worker": "👩‍💼",
    "man_office_worker": "👨‍💼",
    "woman_mechanic": "👩‍🔧",
    "man_mechanic": "👨‍🔧",
    "woman_scientist": "👩‍🔬",
    "man_scientist": "👨‍🔬",
    "woman_artist": "👩‍🎨",
    "man_artist": "👨‍🎨",
    "woman_firefighter": "👩‍🚒",
    "man_firefighter": "👨‍🚒",
    "woman_pilot": "👩‍✈️",
    "man_pilot": "👨‍✈️",
    "woman_astronaut": "👩‍🚀",
    "man_astronaut": "👨‍🚀",
    "woman_judge": "👩‍⚖️",
    "man_judge": "👨‍⚖️",
    "mrs_claus": "🤶",
    "santa": "🎅",
    "sorceress": "🧙‍♀️",
    "wizard": "🧙‍♂️",
    "woman_elf": "🧝‍♀️",
    "man_elf": "🧝‍♂️",
    "woman_vampire": "🧛‍♀️",
    "man_vampire": "🧛‍♂️",
    "woman_zombie": "🧟‍♀️",
    "man_zombie": "🧟‍♂️",
    "woman_genie": "🧞‍♀️",
    "man_genie": "🧞‍♂️",
    "mermaid": "🧜‍♀️",
    "merman": "🧜‍♂️",
    "woman_fairy": "🧚‍♀️",
    "man_fairy": "🧚‍♂️",
    "angel": "👼",
    "pregnant_woman": "🤰",
    "breastfeeding": "🤱",
    "princess": "👸",
    "prince": "🤴",
    "bride_with_veil": "👰",
    "man_in_tuxedo": "🤵",
    "running_woman": "🏃‍♀️",
    "running_man": "🏃",
    "walking_woman": "🚶‍♀️",
    "walking_man": "🚶",
    "dancer": "💃",
    "man_dancing": "🕺",
    "dancing_women": "👯",
    "dancing_men": "👯‍♂️",
    "couple": "👫",
    "two_men_holding_hands": "👬",
    "two_women_holding_hands": "👭",
    "bowing_woman": "🙇‍♀️",
    "bowing_man": "🙇",
    "man_facepalming": "🤦",
    "woman_facepalming": "🤦‍♀️",
    "woman_shrugging": "🤷",
    "man_shrugging": "🤷‍♂️",
    "tipping_hand_woman": "💁",
    "tipping_hand_man": "💁‍♂️",
    "no_good_woman": "🙅",
    "no_good_man": "🙅‍♂️",
    "ok_woman": "🙆",
    "ok_man": "🙆‍♂️",
    "raising_hand_woman": "🙋",
    "raising_hand_man": "🙋‍♂️",
    "pouting_woman": "🙎",
    "pouting_man": "🙎‍♂️",
    "frowning_woman": "🙍",
    "frowning_man": "🙍‍♂️",
    "haircut_woman": "💇",
    "haircut_man": "💇‍♂️",
    "massage_woman": "💆",
    "massage_man": "💆‍♂️",
    "woman_in_steamy_room": "🧖‍♀️",
    "man_in_steamy_room": "🧖‍♂️",
    "couple_with_heart_woman_man": "💑",
    "couple_with_heart_woman_woman": "👩‍❤️‍👩",
    "couple_with_heart_man_man": "👨‍❤️‍👨",
    "couplekiss_man_woman": "💏",
    "couplekiss_woman_woman": "👩‍❤️‍💋‍👩",
    "couplekiss_man_man": "👨‍❤️‍💋‍👨",
    "family_man_woman_boy": "👪",
    "family_man_woman_girl": "👨‍👩‍👧",
    "family_man_woman_girl_boy": "👨‍👩‍👧‍👦",
    "family_man_woman_boy_boy": "👨‍👩‍👦‍👦",
    "family_man_woman_girl_girl": "👨‍👩‍👧‍👧",
    "family_woman_woman_boy": "👩‍👩‍👦",
    "family_woman_woman_girl": "👩‍👩‍👧",
    "family_woman_woman_girl_boy": "👩‍👩‍👧‍👦",
    "family_woman_woman_boy_boy": "👩‍👩‍👦‍👦",
    "family_woman_woman_girl_girl": "👩‍👩‍👧‍👧",
    "family_man_man_boy": "👨‍👨‍👦",
    "family_man_man_girl": "👨‍👨‍👧",
    "family_man_man_girl_boy": "👨‍👨‍👧‍👦",
    "family_man_man_boy_boy": "👨‍👨‍👦‍👦",
    "family_man_man_girl_girl": "👨‍👨‍👧‍👧",
    "family_woman_boy": "👩‍👦",
    "family_woman_girl": "👩‍👧",
    "family_woman_girl_boy": "👩‍👧‍👦",
    "family_woman_boy_boy": "👩‍👦‍👦",
    "family_woman_girl_girl": "👩‍👧‍👧",
    "family_man_boy": "👨‍👦",
    "family_man_girl": "👨‍👧",
    "family_man_girl_boy": "👨‍👧‍👦",
    "family_man_boy_boy": "👨‍👦‍👦",
    "family_man_girl_girl": "👨‍👧‍👧",
    "coat": "🧥",
    "womans_clothes": "👚",
    "tshirt": "👕",
    "jeans": "👖",
    "necktie": "👔",
    "dress": "👗",
    "bikini": "👙",
    "kimono": "👘",
    "lipstick": "💄",
    "kiss": "💋",
    "footprints": "👣",
    "high_heel": "👠",
    "sandal": "👡",
    "boot": "👢",
    "mans_shoe": "👞",
    "athletic_shoe": "👟",
    "socks": "🧦",
    "gloves": "🧤",
    "scarf": "🧣",
    "womans_hat": "👒",
    "tophat": "🎩",
    "billed_hat": "🧢",
    "rescue_worker_helmet": "⛑",
    "mortar_board": "🎓",
    "crown": "👑",
    "school_satchel": "🎒",
    "pouch": "👝",
    "purse": "👛",
    "handbag": "👜",
    "briefcase": "💼",
    "eyeglasses": "👓",
    "dark_sunglasses": "🕶",
    "ring": "💍",
    "closed_umbrella": "🌂",
    "dog": "🐶",
    "cat": "🐱",
    "mouse": "🐭",
    "hamster": "🐹",
    "rabbit": "🐰",
    "fox_face": "🦊",
    "bear": "🐻",
    "panda_face": "🐼",
    "koala": "🐨",
    "tiger": "🐯",
    "lion": "🦁",
    "cow": "🐮",
    "pig": "🐷",
    "pig_nose": "🐽",
    "frog": "🐸",
    "squid": "🦑",
    "octopus": "🐙",
    "shrimp": "🦐",
    "monkey_face": "🐵",
    "gorilla": "🦍",
    "see_no_evil": "🙈",
    "hear_no_evil": "🙉",
    "speak_no_evil": "🙊",
    "monkey": "🐒",
    "chicken": "🐔",
    "penguin": "🐧",
    "bird": "🐦",
    "baby_chick": "🐤",
    "hatching_chick": "🐣",
    "hatched_chick": "🐥",
    "duck": "🦆",
    "eagle": "🦅",
    "owl": "🦉",
    "bat": "🦇",
    "wolf": "🐺",
    "boar": "🐗",
    "horse": "🐴",
    "unicorn": "🦄",
    "honeybee": "🐝",
    "bug": "🐛",
    "butterfly": "🦋",
    "snail": "🐌",
    "beetle": "🐞",
    "ant": "🐜",
    "grasshopper": "🦗",
    "spider": "🕷",
    "scorpion": "🦂",
    "crab": "🦀",
    "snake": "🐍",
    "lizard": "🦎",
    "t-rex": "🦖",
    "sauropod": "🦕",
    "turtle": "🐢",
    "tropical_fish": "🐠",
    "fish": "🐟",
    "blowfish": "🐡",
    "dolphin": "🐬",
    "shark": "🦈",
    "whale": "🐳",
    "whale2": "🐋",
    "crocodile": "🐊",
    "leopard": "🐆",
    "zebra": "🦓",
    "tiger2": "🐅",
    "water_buffalo": "🐃",
    "ox": "🐂",
    "cow2": "🐄",
    "deer": "🦌",
    "dromedary_camel": "🐪",
    "camel": "🐫",
    "giraffe": "🦒",
    "elephant": "🐘",
    "rhinoceros": "🦏",
    "goat": "🐐",
    "ram": "🐏",
    "sheep": "🐑",
    "racehorse": "🐎",
    "pig2": "🐖",
    "rat": "🐀",
    "mouse2": "🐁",
    "rooster": "🐓",
    "turkey": "🦃",
    "dove": "🕊",
    "dog2": "🐕",
    "poodle": "🐩",
    "cat2": "🐈",
    "rabbit2": "🐇",
    "chipmunk": "🐿",
    "hedgehog": "🦔",
    "paw_prints": "🐾",
    "dragon": "🐉",
    "dragon_face": "🐲",
    "cactus": "🌵",
    "christmas_tree": "🎄",
    "evergreen_tree": "🌲",
    "deciduous_tree": "🌳",
    "palm_tree": "🌴",
    "seedling": "🌱",
    "herb": "🌿",
    "shamrock": "☘",
    "four_leaf_clover": "🍀",
    "bamboo": "🎍",
    "tanabata_tree": "🎋",
    "leaves": "🍃",
    "fallen_leaf": "🍂",
    "maple_leaf": "🍁",
    "ear_of_rice": "🌾",
    "hibiscus": "🌺",
    "sunflower": "🌻",
    "rose": "🌹",
    "wilted_flower": "🥀",
    "tulip": "🌷",
    "blossom": "🌼",
    "cherry_blossom": "🌸",
    "bouquet": "💐",
    "mushroom": "🍄",
    "chestnut": "🌰",
    "jack_o_lantern": "🎃",
    "shell": "🐚",
    "spider_web": "🕸",
    "earth_americas": "🌎",
    "earth_africa": "🌍",
    "earth_asia": "🌏",
    "full_moon": "🌕",
    "waning_gibbous_moon": "🌖",
    "last_quarter_moon": "🌗",
    "waning_crescent_moon": "🌘",
    "new_moon": "🌑",
    "waxing_crescent_moon": "🌒",
    "first_quarter_moon": "🌓",
    "waxing_gibbous_moon": "🌔",
    "new_moon_with_face": "🌚",
    "full_moon_with_face": "🌝",
    "first_quarter_moon_with_face": "🌛",
    "last_quarter_moon_with_face": "🌜",
    "sun_with_face": "🌞",
    "crescent_moon": "🌙",
    "star": "⭐",
    "star2": "🌟",
    "dizzy": "💫",
    "sparkles": "✨",
    "comet": "☄",
    "sunny": "☀️",
    "sun_behind_small_cloud": "🌤",
    "partly_sunny": "⛅",
    "sun_behind_large_cloud": "🌥",
    "sun_behind_rain_cloud": "🌦",
    "cloud": "☁️",
    "cloud_with_rain": "🌧",
    "cloud_with_lightning_and_rain": "⛈",
    "cloud_with_lightning": "🌩",
    "zap": "⚡",
    "fire": "🔥",
    "boom": "💥",
    "snowflake": "❄️",
    "cloud_with_snow": "🌨",
    "snowman": "⛄",
    "snowman_with_snow": "☃",
    "wind_face": "🌬",
    "dash": "💨",
    "tornado": "🌪",
    "fog": "🌫",
    "open_umbrella": "☂",
    "umbrella": "☔",
    "droplet": "💧",
    "sweat_drops": "💦",
    "ocean": "🌊",
    "green_apple": "🍏",
    "apple": "🍎",
    "pear": "🍐",
    "tangerine": "🍊",
    "lemon": "🍋",
    "banana": "🍌",
    "watermelon": "🍉",
    "grapes": "🍇",
    "strawberry": "🍓",
    "melon": "🍈",
    "cherries": "🍒",
    "peach": "🍑",
    "pineapple": "🍍",
    "coconut": "🥥",
    "kiwi_fruit": "🥝",
    "avocado": "🥑",
    "broccoli": "🥦",
    "tomato": "🍅",
    "eggplant": "🍆",
    "cucumber": "🥒",
    "carrot": "🥕",
    "hot_pepper": "🌶",
    "potato": "🥔",
    "corn": "🌽",
    "sweet_potato": "🍠",
    "peanuts": "🥜",
    "honey_pot": "🍯",
    "croissant": "🥐",
    "bread": "🍞",
    "baguette_bread": "🥖",
    "pretzel": "🥨",
    "cheese": "🧀",
    "egg": "🥚",
    "bacon": "🥓",
    "steak": "🥩",
    "pancakes": "🥞",
    "poultry_leg": "🍗",
    "meat_on_bone": "🍖",
    "fried_shrimp": "🍤",
    "fried_egg": "🍳",
    "hamburger": "🍔",
    "fries": "🍟",
    "stuffed_flatbread": "🥙",
    "hotdog": "🌭",
    "pizza": "🍕",
    "sandwich": "🥪",
    "canned_food": "🥫",
    "spaghetti": "🍝",
    "taco": "🌮",
    "burrito": "🌯",
    "green_salad": "🥗",
    "shallow_pan_of_food": "🥘",
    "ramen": "🍜",
    "stew": "🍲",
    "fish_cake": "🍥",
    "fortune_cookie": "🥠",
    "sushi": "🍣",
    "bento": "🍱",
    "curry": "🍛",
    "rice_ball": "🍙",
    "rice": "🍚",
    "rice_cracker": "🍘",
    "oden": "🍢",
    "dango": "🍡",
    "shaved_ice": "🍧",
    "ice_cream": "🍨",
    "icecream": "🍦",
    "pie": "🥧",
    "cake": "🍰",
    "birthday": "🎂",
    "custard": "🍮",
    "candy": "🍬",
    "lollipop": "🍭",
    "chocolate_bar": "🍫",
    "popcorn": "🍿",
    "dumpling": "🥟",
    "doughnut": "🍩",
    "cookie": "🍪",
    "milk_glass": "🥛",
    "beer": "🍺",
    "beers": "🍻",
    "clinking_glasses": "🥂",
    "wine_glass": "🍷",
    "tumbler_glass": "🥃",
    "cocktail": "🍸",
    "tropical_drink": "🍹",
    "champagne": "🍾",
    "sake": "🍶",
    "tea": "🍵",
    "cup_with_straw": "🥤",
    "coffee": "☕",
    "baby_bottle": "🍼",
    "spoon": "🥄",
    "fork_and_knife": "🍴",
    "plate_with_cutlery": "🍽",
    "bowl_with_spoon": "🥣",
    "takeout_box": "🥡",
    "chopsticks": "🥢",
    "soccer": "⚽",
    "basketball": "🏀",
    "football": "🏈",
    "baseball": "⚾",
    "tennis": "🎾",
    "volleyball": "🏐",
    "rugby_football": "🏉",
    "8ball": "🎱",
    "golf": "⛳",
    "golfing_woman": "🏌️‍♀️",
    "golfing_man": "🏌",
    "ping_pong": "🏓",
    "badminton": "🏸",
    "goal_net": "🥅",
    "ice_hockey": "🏒",
    "field_hockey": "🏑",
    "cricket": "🏏",
    "ski": "🎿",
    "skier": "⛷",
    "snowboarder": "🏂",
    "person_fencing": "🤺",
    "women_wrestling": "🤼‍♀️",
    "men_wrestling": "🤼‍♂️",
    "woman_cartwheeling": "🤸‍♀️",
    "man_cartwheeling": "🤸‍♂️",
    "woman_playing_handball": "🤾‍♀️",
    "man_playing_handball": "🤾‍♂️",
    "ice_skate": "⛸",
    "curling_stone": "🥌",
    "sled": "🛷",
    "bow_and_arrow": "🏹",
    "fishing_pole_and_fish": "🎣",
    "boxing_glove": "🥊",
    "martial_arts_uniform": "🥋",
    "rowing_woman": "🚣‍♀️",
    "rowing_man": "🚣",
    "climbing_woman": "🧗‍♀️",
    "climbing_man": "🧗‍♂️",
    "swimming_woman": "🏊‍♀️",
    "swimming_man": "🏊",
    "woman_playing_water_polo": "🤽‍♀️",
    "man_playing_water_polo": "🤽‍♂️",
    "woman_in_lotus_position": "🧘‍♀️",
    "man_in_lotus_position": "🧘‍♂️",
    "surfing_woman": "🏄‍♀️",
    "surfing_man": "🏄",
    "bath": "🛀",
    "basketball_woman": "⛹️‍♀️",
    "basketball_man": "⛹",
    "weight_lifting_woman": "🏋️‍♀️",
    "weight_lifting_man": "🏋",
    "biking_woman": "🚴‍♀️",
    "biking_man": "🚴",
    "mountain_biking_woman": "🚵‍♀️",
    "mountain_biking_man": "🚵",
    "horse_racing": "🏇",
    "business_suit_levitating": "🕴",
    "trophy": "🏆",
    "running_shirt_with_sash": "🎽",
    "medal_sports": "🏅",
    "medal_military": "🎖",
    "1st_place_medal": "🥇",
    "2nd_place_medal": "🥈",
    "3rd_place_medal": "🥉",
    "reminder_ribbon": "🎗",
    "rosette": "🏵",
    "ticket": "🎫",
    "tickets": "🎟",
    "performing_arts": "🎭",
    "art": "🎨",
    "circus_tent": "🎪",
    "woman_juggling": "🤹‍♀️",
    "man_juggling": "🤹‍♂️",
    "microphone": "🎤",
    "headphones": "🎧",
    "musical_score": "🎼",
    "musical_keyboard": "🎹",
    "drum": "🥁",
    "saxophone": "🎷",
    "trumpet": "🎺",
    "guitar": "🎸",
    "violin": "🎻",
    "clapper": "🎬",
    "video_game": "🎮",
    "space_invader": "👾",
    "dart": "🎯",
    "game_die": "🎲",
    "slot_machine": "🎰",
    "bowling": "🎳",
    "red_car": "🚗",
    "taxi": "🚕",
    "blue_car": "🚙",
    "bus": "🚌",
    "trolleybus": "🚎",
    "racing_car": "🏎",
    "police_car": "🚓",
    "ambulance": "🚑",
    "fire_engine": "🚒",
    "minibus": "🚐",
    "truck": "🚚",
    "articulated_lorry": "🚛",
    "tractor": "🚜",
    "kick_scooter": "🛴",
    "motorcycle": "🏍",
    "bike": "🚲",
    "motor_scooter": "🛵",
    "rotating_light": "🚨",
    "oncoming_police_car": "🚔",
    "oncoming_bus": "🚍",
    "oncoming_automobile": "🚘",
    "oncoming_taxi": "🚖",
    "aerial_tramway": "🚡",
    "mountain_cableway": "🚠",
    "suspension_railway": "🚟",
    "railway_car": "🚃",
    "train": "🚋",
    "monorail": "🚝",
    "bullettrain_side": "🚄",
    "bullettrain_front": "🚅",
    "light_rail": "🚈",
    "mountain_railway": "🚞",
    "steam_locomotive": "🚂",
    "train2": "🚆",
    "metro": "🚇",
    "tram": "🚊",
    "station": "🚉",
    "flying_saucer": "🛸",
    "helicopter": "🚁",
    "small_airplane": "🛩",
    "airplane": "✈️",
    "flight_departure": "🛫",
    "flight_arrival": "🛬",
    "sailboat": "⛵",
    "motor_boat": "🛥",
    "speedboat": "🚤",
    "ferry": "⛴",
    "passenger_ship": "🛳",
    "rocket": "🚀",
    "artificial_satellite": "🛰",
    "seat": "💺",
    "canoe": "🛶",
    "anchor": "⚓",
    "construction": "🚧",
    "fuelpump": "⛽",
    "busstop": "🚏",
    "vertical_traffic_light": "🚦",
    "traffic_light": "🚥",
    "checkered_flag": "🏁",
    "ship": "🚢",
    "ferris_wheel": "🎡",
    "roller_coaster": "🎢",
    "carousel_horse": "🎠",
    "building_construction": "🏗",
    "foggy": "🌁",
    "tokyo_tower": "🗼",
    "factory": "🏭",
    "fountain": "⛲",
    "rice_scene": "🎑",
    "mountain": "⛰",
    "mountain_snow": "🏔",
    "mount_fuji": "🗻",
    "volcano": "🌋",
    "japan": "🗾",
    "camping": "🏕",
    "tent": "⛺",
    "national_park": "🏞",
    "motorway": "🛣",
    "railway_track": "🛤",
    "sunrise": "🌅",
    "sunrise_over_mountains": "🌄",
    "desert": "🏜",
    "beach_umbrella": "🏖",
    "desert_island": "🏝",
    "city_sunrise": "🌇",
    "city_sunset": "🌆",
    "cityscape": "🏙",
    "night_with_stars": "🌃",
    "bridge_at_night": "🌉",
    "milky_way": "🌌",
    "stars": "🌠",
    "sparkler": "🎇",
    "fireworks": "🎆",
    "rainbow": "🌈",
    "houses": "🏘",
    "european_castle": "🏰",
    "japanese_castle": "🏯",
    "stadium": "🏟",
    "statue_of_liberty": "🗽",
    "house": "🏠",
    "house_with_garden": "🏡",
    "derelict_house": "🏚",
    "office": "🏢",
    "department_store": "🏬",
    "post_office": "🏣",
    "european_post_office": "🏤",
    "hospital": "🏥",
    "bank": "🏦",
    "hotel": "🏨",
    "convenience_store": "🏪",
    "school": "🏫",
    "love_hotel": "🏩",
    "wedding": "💒",
    "classical_building": "🏛",
    "church": "⛪",
    "mosque": "🕌",
    "synagogue": "🕍",
    "kaaba": "🕋",
    "shinto_shrine": "⛩",
    "watch": "⌚",
    "iphone": "📱",
    "calling": "📲",
    "computer": "💻",
    "keyboard": "⌨",
    "desktop_computer": "🖥",
    "printer": "🖨",
    "computer_mouse": "🖱",
    "trackball": "🖲",
    "joystick": "🕹",
    "clamp": "🗜",
    "minidisc": "💽",
    "floppy_disk": "💾",
    "cd": "💿",
    "dvd": "📀",
    "vhs": "📼",
    "camera": "📷",
    "camera_flash": "📸",
    "video_camera": "📹",
    "movie_camera": "🎥",
    "film_projector": "📽",
    "film_strip": "🎞",
    "telephone_receiver": "📞",
    "phone": "☎️",
    "pager": "📟",
    "fax": "📠",
    "tv": "📺",
    "radio": "📻",
    "studio_microphone": "🎙",
    "level_slider": "🎚",
    "control_knobs": "🎛",
    "stopwatch": "⏱",
    "timer_clock": "⏲",
    "alarm_clock": "⏰",
    "mantelpiece_clock": "🕰",
    "hourglass_flowing_sand": "⏳",
    "hourglass": "⌛",
    "satellite": "📡",
    "battery": "🔋",
    "electric_plug": "🔌",
    "bulb": "💡",
    "flashlight": "🔦",
    "candle": "🕯",
    "wastebasket": "🗑",
    "oil_drum": "🛢",
    "money_with_wings": "💸",
    "dollar": "💵",
    "yen": "💴",
    "euro": "💶",
    "pound": "💷",
    "moneybag": "💰",
    "credit_card": "💳",
    "gem": "💎",
    "balance_scale": "⚖",
    "wrench": "🔧",
    "hammer": "🔨",
    "hammer_and_pick": "⚒",
    "hammer_and_wrench": "🛠",
    "pick": "⛏",
    "nut_and_bolt": "🔩",
    "gear": "⚙",
    "chains": "⛓",
    "gun": "🔫",
    "bomb": "💣",
    "hocho": "🔪",
    "dagger": "🗡",
    "crossed_swords": "⚔",
    "shield": "🛡",
    "smoking": "🚬",
    "skull_and_crossbones": "☠",
    "coffin": "⚰",
    "funeral_urn": "⚱",
    "amphora": "🏺",
    "crystal_ball": "🔮",
    "prayer_beads": "📿",
    "barber": "💈",
    "alembic": "⚗",
    "telescope": "🔭",
    "microscope": "🔬",
    "hole": "🕳",
    "pill": "💊",
    "syringe": "💉",
    "thermometer": "🌡",
    "label": "🏷",
    "bookmark": "🔖",
    "toilet": "🚽",
    "shower": "🚿",
    "bathtub": "🛁",
    "key": "🔑",
    "old_key": "🗝",
    "couch_and_lamp": "🛋",
    "sleeping_bed": "🛌",
    "bed": "🛏",
    "door": "🚪",
    "bellhop_bell": "🛎",
    "framed_picture": "🖼",
    "world_map": "🗺",
    "parasol_on_ground": "⛱",
    "moyai": "🗿",
    "shopping": "🛍",
    "shopping_cart": "🛒",
    "balloon": "🎈",
    "flags": "🎏",
    "ribbon": "🎀",
    "gift": "🎁",
    "confetti_ball": "🎊",
    "tada": "🎉",
    "dolls": "🎎",
    "wind_chime": "🎐",
    "crossed_flags": "🎌",
    "izakaya_lantern": "🏮",
    "email": "✉️",
    "envelope_with_arrow": "📩",
    "incoming_envelope": "📨",
    "e-mail": "📧",
    "love_letter": "💌",
    "postbox": "📮",
    "mailbox_closed": "📪",
    "mailbox": "📫",
    "mailbox_with_mail": "📬",
    "mailbox_with_no_mail": "📭",
    "package": "📦",
    "postal_horn": "📯",
    "inbox_tray": "📥",
    "outbox_tray": "📤",
    "scroll": "📜",
    "page_with_curl": "📃",
    "bookmark_tabs": "📑",
    "bar_chart": "📊",
    "chart_with_upwards_trend": "📈",
    "chart_with_downwards_trend": "📉",
    "page_facing_up": "📄",
    "date": "📅",
    "calendar": "📆",
    "spiral_calendar": "🗓",
    "card_index": "📇",
    "card_file_box": "🗃",
    "ballot_box": "🗳",
    "file_cabinet": "🗄",
    "clipboard": "📋",
    "spiral_notepad": "🗒",
    "file_folder": "📁",
    "open_file_folder": "📂",
    "card_index_dividers": "🗂",
    "newspaper_roll": "🗞",
    "newspaper": "📰",
    "notebook": "📓",
    "closed_book": "📕",
    "green_book": "📗",
    "blue_book": "📘",
    "orange_book": "📙",
    "notebook_with_decorative_cover": "📔",
    "ledger": "📒",
    "books": "📚",
    "open_book": "📖",
    "link": "🔗",
    "paperclip": "📎",
    "paperclips": "🖇",
    "scissors": "✂️",
    "triangular_ruler": "📐",
    "straight_ruler": "📏",
    "pushpin": "📌",
    "round_pushpin": "📍",
    "triangular_flag_on_post": "🚩",
    "white_flag": "🏳",
    "black_flag": "🏴",
    "rainbow_flag": "🏳️‍🌈",
    "closed_lock_with_key": "🔐",
    "lock": "🔒",
    "unlock": "🔓",
    "lock_with_ink_pen": "🔏",
    "pen": "🖊",
    "fountain_pen": "🖋",
    "black_nib": "✒️",
    "memo": "📝",
    "pencil2": "✏️",
    "crayon": "🖍",
    "paintbrush": "🖌",
    "mag": "🔍",
    "mag_right": "🔎",
    "heart": "❤️",
    "orange_heart": "🧡",
    "yellow_heart": "💛",
    "green_heart": "💚",
    "blue_heart": "💙",
    "purple_heart": "💜",
    "black_heart": "🖤",
    "broken_heart": "💔",
    "heavy_heart_exclamation": "❣",
    "two_hearts": "💕",
    "revolving_hearts": "💞",
    "heartbeat": "💓",
    "heartpulse": "💗",
    "sparkling_heart": "💖",
    "cupid": "💘",
    "gift_heart": "💝",
    "heart_decoration": "💟",
    "peace_symbol": "☮",
    "latin_cross": "✝",
    "star_and_crescent": "☪",
    "om": "🕉",
    "wheel_of_dharma": "☸",
    "star_of_david": "✡",
    "six_pointed_star": "🔯",
    "menorah": "🕎",
    "yin_yang": "☯",
    "orthodox_cross": "☦",
    "place_of_worship": "🛐",
    "ophiuchus": "⛎",
    "aries": "♈",
    "taurus": "♉",
    "gemini": "♊",
    "cancer": "♋",
    "leo": "♌",
    "virgo": "♍",
    "libra": "♎",
    "scorpius": "♏",
    "sagittarius": "♐",
    "capricorn": "♑",
    "aquarius": "♒",
    "pisces": "♓",
    "id": "🆔",
    "atom_symbol": "⚛",
    "u7a7a": "🈳",
    "u5272": "🈹",
    "radioactive": "☢",
    "biohazard": "☣",
    "mobile_phone_off": "📴",
    "vibration_mode": "📳",
    "u6709": "🈶",
    "u7121": "🈚",
    "u7533": "🈸",
    "u55b6": "🈺",
    "u6708": "🈷️",
    "eight_pointed_black_star": "✴️",
    "vs": "🆚",
    "accept": "🉑",
    "white_flower": "💮",
    "ideograph_advantage": "🉐",
    "secret": "㊙️",
    "congratulations": "㊗️",
    "u5408": "🈴",
    "u6e80": "🈵",
    "u7981": "🈲",
    "a": "🅰️",
    "b": "🅱️",
    "ab": "🆎",
    "cl": "🆑",
    "o2": "🅾️",
    "sos": "🆘",
    "no_entry": "⛔",
    "name_badge": "📛",
    "no_entry_sign": "🚫",
    "x": "❌",
    "o": "⭕",
    "stop_sign": "🛑",
    "anger": "💢",
    "hotsprings": "♨️",
    "no_pedestrians": "🚷",
    "do_not_litter": "🚯",
    "no_bicycles": "🚳",
    "non-potable_water": "🚱",
    "underage": "🔞",
    "no_mobile_phones": "📵",
    "exclamation": "❗",
    "grey_exclamation": "❕",
    "question": "❓",
    "grey_question": "❔",
    "bangbang": "‼️",
    "interrobang": "⁉️",
    "low_brightness": "🔅",
    "high_brightness": "🔆",
    "trident": "🔱",
    "fleur_de_lis": "⚜",
    "part_alternation_mark": "〽️",
    "warning": "⚠️",
    "children_crossing": "🚸",
    "beginner": "🔰",
    "recycle": "♻️",
    "u6307": "🈯",
    "chart": "💹",
    "sparkle": "❇️",
    "eight_spoked_asterisk": "✳️",
    "negative_squared_cross_mark": "❎",
    "white_check_mark": "✅",
    "diamond_shape_with_a_dot_inside": "💠",
    "cyclone": "🌀",
    "loop": "➿",
    "globe_with_meridians": "🌐",
    "m": "Ⓜ️",
    "atm": "🏧",
    "sa": "🈂️",
    "passport_control": "🛂",
    "customs": "🛃",
    "baggage_claim": "🛄",
    "left_luggage": "🛅",
    "wheelchair": "♿",
    "no_smoking": "🚭",
    "wc": "🚾",
    "parking": "🅿️",
    "potable_water": "🚰",
    "mens": "🚹",
    "womens": "🚺",
    "baby_symbol": "🚼",
    "restroom": "🚻",
    "put_litter_in_its_place": "🚮",
    "cinema": "🎦",
    "signal_strength": "📶",
    "koko": "🈁",
    "ng": "🆖",
    "ok": "🆗",
    "up": "🆙",
    "cool": "🆒",
    "new": "🆕",
    "free": "🆓",
    "zero": "0️⃣",
    "one": "1️⃣",
    "two": "2️⃣",
    "three": "3️⃣",
    "four": "4️⃣",
    "five": "5️⃣",
    "six": "6️⃣",
    "seven": "7️⃣",
    "eight": "8️⃣",
    "nine": "9️⃣",
    "keycap_ten": "🔟",
    "asterisk": "*⃣",
    "eject_button": "⏏️",
    "arrow_forward": "▶️",
    "pause_button": "⏸",
    "next_track_button": "⏭",
    "stop_button": "⏹",
    "record_button": "⏺",
    "play_or_pause_button": "⏯",
    "previous_track_button": "⏮",
    "fast_forward": "⏩",
    "rewind": "⏪",
    "twisted_rightwards_arrows": "🔀",
    "repeat": "🔁",
    "repeat_one": "🔂",
    "arrow_backward": "◀️",
    "arrow_up_small": "🔼",
    "arrow_down_small": "🔽",
    "arrow_double_up": "⏫",
    "arrow_double_down": "⏬",
    "arrow_right": "➡️",
    "arrow_left": "⬅️",
    "arrow_up": "⬆️",
    "arrow_down": "⬇️",
    "arrow_upper_right": "↗️",
    "arrow_lower_right": "↘️",
    "arrow_lower_left": "↙️",
    "arrow_upper_left": "↖️",
    "arrow_up_down": "↕️",
    "left_right_arrow": "↔️",
    "arrows_counterclockwise": "🔄",
    "arrow_right_hook": "↪️",
    "leftwards_arrow_with_hook": "↩️",
    "arrow_heading_up": "⤴️",
    "arrow_heading_down": "⤵️",
    "hash": "#️⃣",
    "information_source": "ℹ️",
    "abc": "🔤",
    "abcd": "🔡",
    "capital_abcd": "🔠",
    "symbols": "🔣",
    "musical_note": "🎵",
    "notes": "🎶",
    "wavy_dash": "〰️",
    "curly_loop": "➰",
    "heavy_check_mark": "✔️",
    "arrows_clockwise": "🔃",
    "heavy_plus_sign": "➕",
    "heavy_minus_sign": "➖",
    "heavy_division_sign": "➗",
    "heavy_multiplication_x": "✖️",
    "heavy_dollar_sign": "💲",
    "currency_exchange": "💱",
    "copyright": "©️",
    "registered": "®️",
    "tm": "™️",
    "end": "🔚",
    "back": "🔙",
    "on": "🔛",
    "top": "🔝",
    "soon": "🔜",
    "ballot_box_with_check": "☑️",
    "radio_button": "🔘",
    "white_circle": "⚪",
    "black_circle": "⚫",
    "red_circle": "🔴",
    "large_blue_circle": "🔵",
    "small_orange_diamond": "🔸",
    "small_blue_diamond": "🔹",
    "large_orange_diamond": "🔶",
    "large_blue_diamond": "🔷",
    "small_red_triangle": "🔺",
    "black_small_square": "▪️",
    "white_small_square": "▫️",
    "black_large_square": "⬛",
    "white_large_square": "⬜",
    "small_red_triangle_down": "🔻",
    "black_medium_square": "◼️",
    "white_medium_square": "◻️",
    "black_medium_small_square": "◾",
    "white_medium_small_square": "◽",
    "black_square_button": "🔲",
    "white_square_button": "🔳",
    "speaker": "🔈",
    "sound": "🔉",
    "loud_sound": "🔊",
    "mute": "🔇",
    "mega": "📣",
    "loudspeaker": "📢",
    "bell": "🔔",
    "no_bell": "🔕",
    "black_joker": "🃏",
    "mahjong": "🀄",
    "spades": "♠️",
    "clubs": "♣️",
    "hearts": "♥️",
    "diamonds": "♦️",
    "flower_playing_cards": "🎴",
    "thought_balloon": "💭",
    "right_anger_bubble": "🗯",
    "speech_balloon": "💬",
    "left_speech_bubble": "🗨",
    "clock1": "🕐",
    "clock2": "🕑",
    "clock3": "🕒",
    "clock4": "🕓",
    "clock5": "🕔",
    "clock6": "🕕",
    "clock7": "🕖",
    "clock8": "🕗",
    "clock9": "🕘",
    "clock10": "🕙",
    "clock11": "🕚",
    "clock12": "🕛",
    "clock130": "🕜",
    "clock230": "🕝",
    "clock330": "🕞",
    "clock430": "🕟",
    "clock530": "🕠",
    "clock630": "🕡",
    "clock730": "🕢",
    "clock830": "🕣",
    "clock930": "🕤",
    "clock1030": "🕥",
    "clock1130": "🕦",
    "clock1230": "🕧",
    "afghanistan": "🇦🇫",
    "aland_islands": "🇦🇽",
    "albania": "🇦🇱",
    "algeria": "🇩🇿",
    "american_samoa": "🇦🇸",
    "andorra": "🇦🇩",
    "angola": "🇦🇴",
    "anguilla": "🇦🇮",
    "antarctica": "🇦🇶",
    "antigua_barbuda": "🇦🇬",
    "argentina": "🇦🇷",
    "armenia": "🇦🇲",
    "aruba": "🇦🇼",
    "australia": "🇦🇺",
    "austria": "🇦🇹",
    "azerbaijan": "🇦🇿",
    "bahamas": "🇧🇸",
    "bahrain": "🇧🇭",
    "bangladesh": "🇧🇩",
    "barbados": "🇧🇧",
    "belarus": "🇧🇾",
    "belgium": "🇧🇪",
    "belize": "🇧🇿",
    "benin": "🇧🇯",
    "bermuda": "🇧🇲",
    "bhutan": "🇧🇹",
    "bolivia": "🇧🇴",
    "caribbean_netherlands": "🇧🇶",
    "bosnia_herzegovina": "🇧🇦",
    "botswana": "🇧🇼",
    "brazil": "🇧🇷",
    "british_indian_ocean_territory": "🇮🇴",
    "british_virgin_islands": "🇻🇬",
    "brunei": "🇧🇳",
    "bulgaria": "🇧🇬",
    "burkina_faso": "🇧🇫",
    "burundi": "🇧🇮",
    "cape_verde": "🇨🇻",
    "cambodia": "🇰🇭",
    "cameroon": "🇨🇲",
    "canada": "🇨🇦",
    "canary_islands": "🇮🇨",
    "cayman_islands": "🇰🇾",
    "central_african_republic": "🇨🇫",
    "chad": "🇹🇩",
    "chile": "🇨🇱",
    "cn": "🇨🇳",
    "christmas_island": "🇨🇽",
    "cocos_islands": "🇨🇨",
    "colombia": "🇨🇴",
    "comoros": "🇰🇲",
    "congo_brazzaville": "🇨🇬",
    "congo_kinshasa": "🇨🇩",
    "cook_islands": "🇨🇰",
    "costa_rica": "🇨🇷",
    "croatia": "🇭🇷",
    "cuba": "🇨🇺",
    "curacao": "🇨🇼",
    "cyprus": "🇨🇾",
    "czech_republic": "🇨🇿",
    "denmark": "🇩🇰",
    "djibouti": "🇩🇯",
    "dominica": "🇩🇲",
    "dominican_republic": "🇩🇴",
    "ecuador": "🇪🇨",
    "egypt": "🇪🇬",
    "el_salvador": "🇸🇻",
    "equatorial_guinea": "🇬🇶",
    "eritrea": "🇪🇷",
    "estonia": "🇪🇪",
    "ethiopia": "🇪🇹",
    "eu": "🇪🇺",
    "falkland_islands": "🇫🇰",
    "faroe_islands": "🇫🇴",
    "fiji": "🇫🇯",
    "finland": "🇫🇮",
    "fr": "🇫🇷",
    "french_guiana": "🇬🇫",
    "french_polynesia": "🇵🇫",
    "french_southern_territories": "🇹🇫",
    "gabon": "🇬🇦",
    "gambia": "🇬🇲",
    "georgia": "🇬🇪",
    "de": "🇩🇪",
    "ghana": "🇬🇭",
    "gibraltar": "🇬🇮",
    "greece": "🇬🇷",
    "greenland": "🇬🇱",
    "grenada": "🇬🇩",
    "guadeloupe": "🇬🇵",
    "guam": "🇬🇺",
    "guatemala": "🇬🇹",
    "guernsey": "🇬🇬",
    "guinea": "🇬🇳",
    "guinea_bissau": "🇬🇼",
    "guyana": "🇬🇾",
    "haiti": "🇭🇹",
    "honduras": "🇭🇳",
    "hong_kong": "🇭🇰",
    "hungary": "🇭🇺",
    "iceland": "🇮🇸",
    "india": "🇮🇳",
    "indonesia": "🇮🇩",
    "iran": "🇮🇷",
    "iraq": "🇮🇶",
    "ireland": "🇮🇪",
    "isle_of_man": "🇮🇲",
    "israel": "🇮🇱",
    "it": "🇮🇹",
    "cote_divoire": "🇨🇮",
    "jamaica": "🇯🇲",
    "jp": "🇯🇵",
    "jersey": "🇯🇪",
    "jordan": "🇯🇴",
    "kazakhstan": "🇰🇿",
    "kenya": "🇰🇪",
    "kiribati": "🇰🇮",
    "kosovo": "🇽🇰",
    "kuwait": "🇰🇼",
    "kyrgyzstan": "🇰🇬",
    "laos": "🇱🇦",
    "latvia": "🇱🇻",
    "lebanon": "🇱🇧",
    "lesotho": "🇱🇸",
    "liberia": "🇱🇷",
    "libya": "🇱🇾",
    "liechtenstein": "🇱🇮",
    "lithuania": "🇱🇹",
    "luxembourg": "🇱🇺",
    "macau": "🇲🇴",
    "macedonia": "🇲🇰",
    "madagascar": "🇲🇬",
    "malawi": "🇲🇼",
    "malaysia": "🇲🇾",
    "maldives": "🇲🇻",
    "mali": "🇲🇱",
    "malta": "🇲🇹",
    "marshall_islands": "🇲🇭",
    "martinique": "🇲🇶",
    "mauritania": "🇲🇷",
    "mauritius": "🇲🇺",
    "mayotte": "🇾🇹",
    "mexico": "🇲🇽",
    "micronesia": "🇫🇲",
    "moldova": "🇲🇩",
    "monaco": "🇲🇨",
    "mongolia": "🇲🇳",
    "montenegro": "🇲🇪",
    "montserrat": "🇲🇸",
    "morocco": "🇲🇦",
    "mozambique": "🇲🇿",
    "myanmar": "🇲🇲",
    "namibia": "🇳🇦",
    "nauru": "🇳🇷",
    "nepal": "🇳🇵",
    "netherlands": "🇳🇱",
    "new_caledonia": "🇳🇨",
    "new_zealand": "🇳🇿",
    "nicaragua": "🇳🇮",
    "niger": "🇳🇪",
    "nigeria": "🇳🇬",
    "niue": "🇳🇺",
    "norfolk_island": "🇳🇫",
    "northern_mariana_islands": "🇲🇵",
    "north_korea": "🇰🇵",
    "norway": "🇳🇴",
    "oman": "🇴🇲",
    "pakistan": "🇵🇰",
    "palau": "🇵🇼",
    "palestinian_territories": "🇵🇸",
    "panama": "🇵🇦",
    "papua_new_guinea": "🇵🇬",
    "paraguay": "🇵🇾",
    "peru": "🇵🇪",
    "philippines": "🇵🇭",
    "pitcairn_islands": "🇵🇳",
    "poland": "🇵🇱",
    "portugal": "🇵🇹",
    "puerto_rico": "🇵🇷",
    "qatar": "🇶🇦",
    "reunion": "🇷🇪",
    "romania": "🇷🇴",
    "ru": "🇷🇺",
    "rwanda": "🇷🇼",
    "st_barthelemy": "🇧🇱",
    "st_helena": "🇸🇭",
    "st_kitts_nevis": "🇰🇳",
    "st_lucia": "🇱🇨",
    "st_pierre_miquelon": "🇵🇲",
    "st_vincent_grenadines": "🇻🇨",
    "samoa": "🇼🇸",
    "san_marino": "🇸🇲",
    "sao_tome_principe": "🇸🇹",
    "saudi_arabia": "🇸🇦",
    "senegal": "🇸🇳",
    "serbia": "🇷🇸",
    "seychelles": "🇸🇨",
    "sierra_leone": "🇸🇱",
    "singapore": "🇸🇬",
    "sint_maarten": "🇸🇽",
    "slovakia": "🇸🇰",
    "slovenia": "🇸🇮",
    "solomon_islands": "🇸🇧",
    "somalia": "🇸🇴",
    "south_africa": "🇿🇦",
    "south_georgia_south_sandwich_islands": "🇬🇸",
    "kr": "🇰🇷",
    "south_sudan": "🇸🇸",
    "es": "🇪🇸",
    "sri_lanka": "🇱🇰",
    "sudan": "🇸🇩",
    "suriname": "🇸🇷",
    "swaziland": "🇸🇿",
    "sweden": "🇸🇪",
    "switzerland": "🇨🇭",
    "syria": "🇸🇾",
    "taiwan": "🇹🇼",
    "tajikistan": "🇹🇯",
    "tanzania": "🇹🇿",
    "thailand": "🇹🇭",
    "timor_leste": "🇹🇱",
    "togo": "🇹🇬",
    "tokelau": "🇹🇰",
    "tonga": "🇹🇴",
    "trinidad_tobago": "🇹🇹",
    "tunisia": "🇹🇳",
    "tr": "🇹🇷",
    "turkmenistan": "🇹🇲",
    "turks_caicos_islands": "🇹🇨",
    "tuvalu": "🇹🇻",
    "uganda": "🇺🇬",
    "ukraine": "🇺🇦",
    "united_arab_emirates": "🇦🇪",
    "uk": "🇬🇧",
    "england": "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
    "scotland": "🏴󠁧󠁢󠁳󠁣󠁴󠁿",
    "wales": "🏴󠁧󠁢󠁷󠁬󠁳󠁿",
    "us": "🇺🇸",
    "us_virgin_islands": "🇻🇮",
    "uruguay": "🇺🇾",
    "uzbekistan": "🇺🇿",
    "vanuatu": "🇻🇺",
    "vatican_city": "🇻🇦",
    "venezuela": "🇻🇪",
    "vietnam": "🇻🇳",
    "wallis_futuna": "🇼🇫",
    "western_sahara": "🇪🇭",
    "yemen": "🇾🇪",
    "zambia": "🇿🇲",
    "zimbabwe": "🇿🇼"
};

function UnitSelectorMenuItem() {
    this._init.apply(this, arguments);
}

UnitSelectorMenuItem.prototype = {
    __proto__: PopupMenu.PopupIndicatorMenuItem.prototype,

    _init: function(aSubMenu, aLabel, aValue, aUnitsKey) {
        PopupMenu.PopupIndicatorMenuItem.prototype._init.call(this, aLabel);
        this._subMenu = aSubMenu;
        this._applet = aSubMenu._applet;
        this._value = aValue;
        this._unitsKey = aUnitsKey;
        this.setOrnament(OrnamentType.DOT);

        this._handler_id = this.connect("activate", Lang.bind(this, function() {
            this._applet[this._unitsKey] = this._value;
            this._subMenu._setCheckedState();
            this._applet.update();
            return true; // Avoids the closing of the sub menu.
        }));

        this._ornament.child._delegate.setToggleState(this._applet[this._unitsKey] === this._value);
    },

    destroy: function() {
        this.disconnect(this._handler_id);
        PopupMenu.PopupIndicatorMenuItem.prototype.destroy.call(this);
    }
};

function UnitSelectorSubMenuMenuItem() {
    this._init.apply(this, arguments);
}

UnitSelectorSubMenuMenuItem.prototype = {
    __proto__: PopupMenu.PopupSubMenuMenuItem.prototype,

    _init: function(aApplet, aLabel, aUnitsKey, aValueKey) {
        this._applet = aApplet;
        this._unitsKey = aUnitsKey;
        this._valueKey = aValueKey;
        this._label = aLabel;

        PopupMenu.PopupSubMenuMenuItem.prototype._init.call(this, " "); // ¬¬

        this.setLabel();
        this._populateMenu();
        this._applet.settings.connect("changed::" + this._valueKey,
            Lang.bind(this, this.setLabel));
    },

    setLabel: function() {
        this.label.clutter_text.set_markup(
            this._label + " " + this._applet[this._valueKey] + " " +
            getUnitPluralForm(this._applet[this._unitsKey], this._applet[this._valueKey])
        );
    },

    _populateMenu: function() {
        this.label.grab_key_focus();
        this.menu.removeAll();
        for (let unit in UNITS_MAP) {
            let item = new UnitSelectorMenuItem(
                this,
                UNITS_MAP[unit].capital,
                unit,
                this._unitsKey
            );
            this.menu.addMenuItem(item);
        }
    },

    _setCheckedState: function() {
        let children = this.menu._getMenuItems();
        let i = 0,
            iLen = children.length;

        for (; i < iLen; i++) {
            let item = children[i];
            if (item instanceof UnitSelectorMenuItem) { // Just in case
                item._ornament.child._delegate.setToggleState(this._applet[this._unitsKey] === item._value);
            }
        }
    }
};

/*
A custom PopupSliderMenuItem element whose value is changed by a step of 1.
*/
function CustomPopupSliderMenuItem() {
    this._init.apply(this, arguments);
}

CustomPopupSliderMenuItem.prototype = {
    __proto__: PopupMenu.PopupSliderMenuItem.prototype,

    _init: function(aValue) {
        PopupMenu.PopupBaseMenuItem.prototype._init.call(this, {
            activate: false
        });

        this.actor.connect("key-press-event", Lang.bind(this, this._onKeyPressEvent));

        // Avoid spreading NaNs around
        if (isNaN(aValue)) {
            throw TypeError("The slider value must be a number.");
        }

        this._value = Math.max(Math.min(aValue, 1), 0);

        this._slider = new St.DrawingArea({
            style_class: "popup-slider-menu-item",
            reactive: true
        });
        this.addActor(this._slider, {
            span: -1,
            expand: true
        });
        this._slider.connect("repaint", Lang.bind(this, this._sliderRepaint));
        this.actor.connect("button-press-event", Lang.bind(this, this._startDragging));
        this.actor.connect("scroll-event", Lang.bind(this, this._onScrollEvent));

        this._releaseId = this._motionId = 0;
        this._dragging = false;
        this._associatedLabel = null;
    },

    _onScrollEvent: function(aActor, aEvent) {
        let direction = aEvent.get_scroll_direction();
        let scale = this.ctrlKey ? SLIDER_SCALE * 11.5 : SLIDER_SCALE;

        if (direction === Clutter.ScrollDirection.DOWN) {
            // Original "scale" was 0.05.
            this._value = Math.max(0, this._value - scale);
        } else if (direction === Clutter.ScrollDirection.UP) {
            this._value = Math.min(1, this._value + scale);
        }

        this._slider.queue_repaint();
        this.emit("value-changed", this._value);
    },

    _onKeyPressEvent: function(aActor, aEvent) {
        let key = aEvent.get_key_symbol();
        let scale = this.ctrlKey ? SLIDER_SCALE * 11.5 : SLIDER_SCALE;

        if (key === Clutter.KEY_Right || key === Clutter.KEY_Left) {
            // Original "scale" was 0.1.
            let delta = key === Clutter.KEY_Right ? scale : -scale;
            this._value = Math.max(0, Math.min(this._value + delta, 1));
            this._slider.queue_repaint();
            this.emit("value-changed", this._value);
            this.emit("drag-end");
            return true;
        }
        return false;
    },

    get ctrlKey() {
        return (Clutter.ModifierType.CONTROL_MASK & global.get_pointer()[2]) !== 0;
    }
};

function ArgosLineView() {
    this._init.apply(this, arguments);
}

ArgosLineView.prototype = {
    _init: function(aApplet, aLine) {
        this._applet = aApplet;

        this.actor = new St.BoxLayout();
        this.actor._delegate = this;

        if (typeof aLine !== "undefined") {
            this.setLine(aLine);
        }
    },

    setLine: function(aLine) {
        this.line = aLine;

        // Special case for the moronic Cinnamon 2.8.x
        // actor.remove_all_children > Doesn't work.
        // actor.destroy_all_children > Doesn't work.
        // actor.destroy_children > Doesn't work.
        // And all of those are available functions on 2.8.x!!!! ¬¬
        // By "doesn't work" I mean that, all children are removed,
        // but the space occupied by them still remains.
        if (CINN_2_8) {
            let children = this.actor.get_children();

            for (let i = children.length - 1; i >= 0; i--) {
                try {
                    children[i].destroy();
                } catch (aErr) {
                    continue;
                }
            }
        } else {
            this.actor.remove_all_children();
        }

        if (aLine.hasOwnProperty("iconName")) {
            let icon = null;
            let iconName = aLine.iconName;
            // if the aLine.iconName is a path to an icon
            if (iconName[0] === "/" || iconName[0] === "~") {
                // Expand ~ to the user's home folder.
                if (/^~\//.test(iconName)) {
                    iconName = iconName.replace(/^~\//, GLib.get_home_dir() + "/");
                }

                let file = Gio.file_new_for_path(iconName);
                let iconFile = new Gio.FileIcon({
                    file: file
                });

                icon = new St.Icon({
                    style_class: "popup-menu-icon",
                    gicon: iconFile,
                    icon_size: (aLine.hasOwnProperty("iconSize") ?
                        aLine.iconSize :
                        this._applet.pref_default_icon_size),
                    // It seems that this is not supported.
                    // icon_type: (aLine.iconIsSymbolic !== "true" ?
                    //     St.IconType.FULLCOLOR :
                    //     St.IconType.SYMBOLIC)
                });
            } else { // use a themed icon
                icon = new St.Icon({
                    style_class: "popup-menu-icon",
                    icon_size: (aLine.hasOwnProperty("iconSize") ?
                        aLine.iconSize :
                        this._applet.pref_default_icon_size),
                    icon_name: iconName,
                    icon_type: (!aLine.hasOwnProperty("iconIsSymbolic") ||
                        (aLine.hasOwnProperty("iconIsSymbolic") && aLine.iconIsSymbolic !== "true") ?
                        St.IconType.FULLCOLOR :
                        St.IconType.SYMBOLIC)
                });
            }

            if (icon !== null) {
                this.actor.add_actor(icon);
            }
        }

        if (aLine.hasOwnProperty("image") || aLine.hasOwnProperty("templateImage")) {
            let image = aLine.hasOwnProperty("image") ? aLine.image : aLine.templateImage;

            // Source: https://github.com/GNOME/gnome-maps (mapSource.js)
            let bytes = GLib.Bytes.new(GLib.base64_decode(image));
            let stream = Gio.MemoryInputStream.new_from_bytes(bytes);

            try {
                let pixbuf = GdkPixbuf.Pixbuf.new_from_stream(stream, null);

                // TextureCache.load_gicon returns a square texture no matter what the Pixbuf's
                // actual dimensions are, so we request a size that can hold all pixels of the
                // image and then resize manually afterwards
                let size = Math.max(pixbuf.width, pixbuf.height);
                let texture = St.TextureCache.get_default().load_gicon(null, pixbuf, size, 1);

                let aspectRatio = pixbuf.width / pixbuf.height;

                let width = parseInt(aLine.imageWidth, 10);
                let height = parseInt(aLine.imageHeight, 10);

                if (isNaN(width) && isNaN(height)) {
                    width = pixbuf.width;
                    height = pixbuf.height;
                } else if (isNaN(width)) {
                    width = Math.round(height * aspectRatio);
                } else if (isNaN(height)) {
                    height = Math.round(width / aspectRatio);
                }

                texture.set_size(width, height);

                this.actor.add_actor(texture);
                // Do not stretch the texture to the height of the container
                this.actor.child_set_property(texture, "y-fill", false);
            } catch (aErr) {
                // TO TRANSLATORS: Full sentence:
                // "Unable to load image from Base64 representation: ErrorMessage"
                global.logError(_("Unable to load image from Base64 representation: %s")
                    .format(aErr));
            }
        }

        if (aLine.hasOwnProperty("markup") && aLine.markup.length > 0) {
            let label = new St.Label({
                y_expand: true,
                y_align: Clutter.ActorAlign.CENTER
            });

            this.actor.add_actor(label);

            let clutterText = label.get_clutter_text();
            clutterText.use_markup = true;
            clutterText.text = aLine.markup;

            if (aLine.hasOwnProperty("length")) {
                let maxLength = parseInt(aLine.length, 10);
                // "clutterText.text.length" fails for non-BMP Unicode characters
                let textLength = clutterText.buffer.get_length();

                if (!isNaN(maxLength) && textLength > maxLength) {
                    clutterText.set_cursor_position(maxLength);
                    clutterText.delete_chars(textLength);
                    clutterText.insert_text("...", maxLength);
                }
            }
        }
    },

    setMarkup: function(aMarkup) {
        this.setLine({
            markup: aMarkup
        });
    }
};

/*
Implemented the AltSwitcher used by Gnome Shell instead of using the Cinnamon's
native PopupAlternatingMenuItem.
I did this so I can keep the applet code as close to the original extension as possible.
Plus, AltSwitcher is infinitely easier to use than PopupAlternatingMenuItem. So, it's a win-win.
*/
function AltSwitcher() {
    this._init.apply(this, arguments);
}

AltSwitcher.prototype = {
    _init: function(aStandard, aAlternate) {
        this._standard = aStandard;
        this._standard.connect("notify::visible", Lang.bind(this, this._sync));

        this._alternate = aAlternate;
        this._alternate.connect("notify::visible", Lang.bind(this, this._sync));

        this._capturedEventId = global.stage.connect("captured-event",
            Lang.bind(this, this._onCapturedEvent));

        this._flipped = false;

        this._clickAction = new Clutter.ClickAction();
        this._clickAction.connect("long-press", Lang.bind(this, this._onLongPress));

        this.actor = new St.Bin();
        this.actor.add_style_class_name("popup-alternating-menu-item");
        this.actor.connect("destroy", Lang.bind(this, this._onDestroy));
        this.actor.connect("notify::mapped", Lang.bind(this, function() {
            this._flipped = false;
        }));
    },

    _sync: function() {
        let childToShow = null;

        if (this._standard.visible && this._alternate.visible) {
            // I almost had to use a crystal ball to divine that the Right Alt modifier
            // is called Clutter.ModifierType.MOD5_MASK. ¬¬
            if (this._flipped) {
                childToShow = this.altKey ? this._standard : this._alternate;
            } else {
                childToShow = this.altKey ? this._alternate : this._standard;
            }
        } else if (this._standard.visible) {
            childToShow = this._standard;
        } else if (this._alternate.visible) {
            childToShow = this._alternate;
        }

        let childShown = this.actor.get_child();
        if (childShown !== childToShow) {
            if (childShown) {
                if (childShown.fake_release) {
                    childShown.fake_release();
                }
                childShown.remove_action(this._clickAction);
            }
            childToShow.add_action(this._clickAction);

            let hasFocus = this.actor.contains(global.stage.get_key_focus());
            this.actor.set_child(childToShow);
            if (hasFocus) {
                childToShow.grab_key_focus();
            }

            // The actors might respond to hover, so
            // sync the pointer to make sure they update.
            global.sync_pointer();
        }

        this.actor.visible = (childToShow !== null);
    },

    _onDestroy: function() {
        if (this._capturedEventId > 0) {
            global.stage.disconnect(this._capturedEventId);
            this._capturedEventId = 0;
        }
    },

    _onCapturedEvent: function(aActor, aEvent) {
        let type = aEvent.type();

        if (type === Clutter.EventType.KEY_PRESS || type === Clutter.EventType.KEY_RELEASE) {
            let key = aEvent.get_key_symbol();

            // Nonsense time!!! On Linux Mint 18 with Cinnamon 3.0.7, pressing the Alt Right key
            // gives a keycode of 65027 and Clutter docs say that that keycode belongs
            // to Clutter.KEY_ISO_Level3_Shift. That's why I make that third ckeck,
            // because Clutter.KEY_Alt_R isn't recognised as pressing Alt Right key. ¬¬
            // See _sync, because the stupid nonsense continues!!!
            switch (key) {
                case Clutter.KEY_ISO_Level3_Shift:
                case Clutter.KEY_Alt_L:
                case Clutter.KEY_Alt_R:
                    this._sync();
                    break;
            }
        }

        return Clutter.EVENT_PROPAGATE;
    },

    _onLongPress: function(aAction, aActor, aState) {
        if (aState === Clutter.LongPressState.QUERY ||
            aState === Clutter.LongPressState.CANCEL) {
            return true;
        }

        this._flipped = !this._flipped;
        this._sync();

        return true;
    },

    get altKey() {
        return (Clutter.ModifierType.MOD1_MASK & global.get_pointer()[2]) !== 0 ||
            (Clutter.ModifierType.MOD5_MASK & global.get_pointer()[2]) !== 0;
    }
};

function ArgosMenuItem() {
    this._init.apply(this, arguments);
}

ArgosMenuItem.prototype = {
    __proto__: PopupMenu.PopupBaseMenuItem.prototype,

    _init: function(aApplet, aLine, aAlternateLine) {
        let hasAction = aLine.hasAction || (typeof aAlternateLine !== "undefined" &&
            aAlternateLine.hasAction);

        PopupMenu.PopupBaseMenuItem.prototype._init.call(this, {
            activate: hasAction,
            hover: hasAction,
            focusOnHover: hasAction
        });

        this._applet = aApplet;

        let altSwitcher = null;

        let lineView = new ArgosLineView(aApplet, aLine);
        lineView.actor.set_style("spacing: " + aApplet.pref_menu_spacing + "em;");

        if (aLine.hasOwnProperty("tooltip")) {
            this.tooltip = new CustomTooltip(
                this.actor,
                aLine.tooltip
            );
        }

        if (typeof aAlternateLine === "undefined") {
            this.addActor(lineView.actor);
        } else {
            let alternateLineView = new ArgosLineView(aApplet, aAlternateLine);
            alternateLineView.actor.set_style("spacing: " + aApplet.pref_menu_spacing + "em;");
            // The following class and pseudo class are set so the AltSwitcher is styled somewhat
            // the same as the Cinnamon's default.
            alternateLineView.actor.add_style_class_name("popup-alternating-menu-item");
            alternateLineView.actor.add_style_pseudo_class("alternate");
            altSwitcher = new AltSwitcher(lineView.actor, alternateLineView.actor);
            lineView.actor.visible = true;
            alternateLineView.actor.visible = true;
            this.addActor(altSwitcher.actor);
        }

        if (hasAction) {
            this.connect("activate", Lang.bind(this, function() {
                let activeLine = (altSwitcher === null) ?
                    aLine :
                    altSwitcher.actor.get_child()._delegate.line;

                if (activeLine.hasOwnProperty("href")) {
                    // On the original extension was:
                    // Gio.AppInfo.launch_default_for_uri(activeLine.href, null);
                    Util.spawn_async(["xdg-open", activeLine.href], null);
                }

                if (activeLine.hasOwnProperty("eval")) {
                    try {
                        eval(activeLine.eval);
                    } catch (aErr) {
                        global.logError(aErr);
                    }
                }

                if (activeLine.hasOwnProperty("bash")) {
                    let argv = [];

                    if (!activeLine.hasOwnProperty("terminal") || activeLine.terminal === "false") {
                        argv = [
                            "bash",
                            "-c",
                            activeLine.bash
                        ];
                    } else if (activeLine.hasOwnProperty("terminal") && activeLine.terminal === "true") {
                        // Run bash immediately after executing the command to keep the terminal window open
                        // (see http://stackoverflow.com/q/3512055)
                        argv = [
                            aApplet.pref_terminal_emulator,
                            "-e",
                            "bash -c " + GLib.shell_quote(activeLine.bash + "; exec bash")
                        ];
                    }

                    let [success, pid] = GLib.spawn_async(null, argv, null,
                        GLib.SpawnFlags.SEARCH_PATH | GLib.SpawnFlags.DO_NOT_REAP_CHILD, null);

                    if (success) {
                        GLib.child_watch_add(GLib.PRIORITY_DEFAULT_IDLE, pid, function() {
                            if (activeLine.hasOwnProperty("refresh") && activeLine.refresh === "true") {
                                aApplet.update();
                            }
                        });
                    }
                }

                if (activeLine.hasOwnProperty("refresh") && activeLine.refresh === "true") {
                    aApplet.update();
                }

                this._applet.menu.close();
            }));
        }
    }
};

/*
I had to implement a custom sub menu item due to the fact that I never could make
the insert_child_below method to work on Cinnamon.
*/
function CustomSubMenuItem() {
    this._init.apply(this, arguments);
}

CustomSubMenuItem.prototype = {
    __proto__: PopupMenu.PopupSubMenuMenuItem.prototype,

    _init: function(aApplet, aActor, aMenuLevel) {
        PopupMenu.PopupBaseMenuItem.prototype._init.call(this);

        this._applet = aApplet;

        this._triangleBin = new St.Bin({
            x_expand: true,
            x_align: St.Align.END
        });
        this._triangle = arrowIcon(St.Side.RIGHT);
        this._triangle.pivot_point = new Clutter.Point({
            x: 0.5,
            y: 0.6
        });
        this._triangleBin.child = this._triangle;
        this.menu = new PopupMenu.PopupSubMenu(this.actor, this._triangle);

        if (Number(aMenuLevel) === 0) {
            this.menu.connect("open-state-changed", Lang.bind(this, this._subMenuOpenStateChanged));
        }

        this.menu.box.set_y_expand = true;
        this.menu.box.set_x_expand = true;

        this.addActor(aActor, {
            expand: false,
            span: 0,
            align: St.Align.START
        });
        // Kind of pointless to set a spacing, but it doesn't hurt.
        aActor.set_style("spacing: " + this._applet.pref_menu_spacing + "em;");

        // Add the triangle to emulate accurately a sub menu item.
        this.addActor(this._triangleBin, {
            expand: true,
            span: -1,
            align: St.Align.END
        });
    },

    destroy: function() {
        this.menu.close(this._applet.pref_animate_menu);
        this.disconnectAll();
        this.menu.removeAll();
        this.actor.destroy();
    },

    _subMenuOpenStateChanged: function(aMenu, aOpen) {
        if (aOpen && this._applet.pref_keep_one_menu_open) {
            let children = aMenu._getTopMenu()._getMenuItems();
            let i = 0,
                iLen = children.length;
            for (; i < iLen; i++) {
                let item = children[i];

                if (item instanceof CustomSubMenuItem) {
                    if (aMenu !== item.menu) {
                        item.menu.close(true);
                    }
                }
            }
        }
    }
};

/*
A custom tooltip with the following features:
- Text aligned to the left.
- Line wrap set to true.
- A max width of 450 pixels to force the line wrap.
*/
function CustomTooltip() {
    this._init.apply(this, arguments);
}

CustomTooltip.prototype = {
    __proto__: Tooltips.Tooltip.prototype,

    _init: function(aActor, aText) {
        Tooltips.Tooltip.prototype._init.call(this, aActor, aText);

        this._tooltip.set_style("text-align: left;width:auto;max-width: 450px;");
        this._tooltip.get_clutter_text().set_line_wrap(true);
        this._tooltip.get_clutter_text().set_line_wrap_mode(Pango.WrapMode.WORD_CHAR);
        this._tooltip.get_clutter_text().ellipsize = Pango.EllipsizeMode.NONE; // Just in case

        aActor.connect("destroy", Lang.bind(this, function() {
            this.destroy();
        }));
    },

    destroy: function() {
        Tooltips.Tooltip.prototype.destroy.call(this);
    }
};

function arrowIcon(side) {
    let iconName;
    switch (side) {
        case St.Side.TOP:
            iconName = "pan-up";
            break;
        case St.Side.RIGHT:
            iconName = "pan-end";
            break;
        case St.Side.BOTTOM:
            iconName = "pan-down";
            break;
        case St.Side.LEFT:
            iconName = "pan-start";
            break;
    }

    let arrow = new St.Icon({
        style_class: "popup-menu-arrow",
        icon_name: iconName,
        icon_type: St.IconType.SYMBOLIC,
        y_expand: true,
        y_align: Clutter.ActorAlign.CENTER,
        important: true
    });

    return arrow;
}

// Performs (mostly) BitBar-compatible output line parsing
// (see https://github.com/matryer/bitbar#plugin-api)
function parseLine(aLineString) {
    let line = {};

    let separatorIndex = aLineString.indexOf("|");

    if (separatorIndex >= 0) {
        let attributes = [];
        try {
            attributes = GLib.shell_parse_argv(aLineString.substring(separatorIndex + 1))[1];
        } catch (aErr) {
            global.logError("Unable to parse attributes for line '" + aLineString + "': " + aErr);
        }

        let i = 0,
            iLen = attributes.length;
        for (; i < iLen; i++) {
            let assignmentIndex = attributes[i].indexOf("=");

            if (assignmentIndex >= 0) {
                let name = attributes[i].substring(0, assignmentIndex).trim();
                let value = attributes[i].substring(assignmentIndex + 1).trim();

                if (name.length > 0 && value.length > 0) {
                    line[name] = value;
                }
            }
        }

        line.text = aLineString.substring(0, separatorIndex);

    } else {
        // Line has no attributes
        line.text = aLineString;
    }

    let leadingDashes = line.text.search(/[^-]/);
    if (leadingDashes >= 2) {
        line.menuLevel = Math.floor(leadingDashes / 2);
        line.text = line.text.substring(line.menuLevel * 2);
    } else {
        line.menuLevel = 0;
    }

    line.isSeparator = /^-+$/.test(line.text.trim());

    let markupAttributes = [];

    if (line.hasOwnProperty("color")) {
        markupAttributes.push("color='" + GLib.markup_escape_text(line.color, -1) + "'");
    }

    if (line.hasOwnProperty("font")) {
        markupAttributes.push("font_family='" + GLib.markup_escape_text(line.font, -1) + "'");
    }

    if (line.hasOwnProperty("size")) {
        let pointSize = parseFloat(line.size);
        // Pango expects numerical sizes in 1024ths of a point
        // (see https://developer.gnome.org/pango/stable/PangoMarkupFormat.html)
        let fontSize = (isNaN(pointSize)) ? line.size : Math.round(1024 * pointSize).toString();
        markupAttributes.push("font_size='" + GLib.markup_escape_text(fontSize, -1) + "'");
    }

    line.markup = line.text;

    if (!line.hasOwnProperty("unescape") || (line.hasOwnProperty("unescape") && line.unescape !== "false")) {
        line.markup = GLib.strcompress(line.markup);
    }

    if (!line.hasOwnProperty("emojize") || (line.hasOwnProperty("emojize") && line.emojize !== "false")) {
        line.markup = line.markup.replace(/:([\w+-]+):/g, function(aMatch, aEmojiName) {
            let emojiName = aEmojiName.toLowerCase();
            return Emojis.hasOwnProperty(emojiName) ? Emojis[emojiName] : aMatch;
        });
    }

    if (!line.hasOwnProperty("trim") || (line.hasOwnProperty("trim") && line.trim !== "false")) {
        line.markup = line.markup.trim();
    }

    if (line.hasOwnProperty("useMarkup") && line.useMarkup === "false") {
        line.markup = GLib.markup_escape_text(line.markup, -1);
        // Restore escaped ESC characters (needed for ANSI sequences)
        line.markup = line.markup.replace("&#x1b;", "\x1b");
    }

    // Note that while it is possible to format text using a combination of Pango markup
    // and ANSI escape sequences, lines like "<b>ABC \e[1m DEF</b>" lead to unmatched tags
    if (!line.hasOwnProperty("ansi") || (line.hasOwnProperty("ansi") && line.ansi !== "false")) {
        line.markup = ansiToMarkup(line.markup);
    }

    if (markupAttributes && markupAttributes.length > 0) {
        line.markup = "<span " + markupAttributes.join(" ") + ">" + line.markup + "</span>";
    }

    if (line.hasOwnProperty("bash")) {
        // Append BitBar's legacy "paramN" attributes to the bash command
        // (Argos allows placing arguments directy in the command string)
        let i = 1;
        while (line.hasOwnProperty("param" + i)) {
            line.bash += " " + GLib.shell_quote(line["param" + i]);
            i++;
        }
    }

    // Expand ~ to the user's home folder.
    if (line.hasOwnProperty("href")) {
        if (/^~\//.test(line.href)) {
            line.href = line.href.replace(/^~\//, "file://" + GLib.get_home_dir() + "/");
        }
    }

    line.hasAction = line.hasOwnProperty("bash") || line.hasOwnProperty("href") ||
        line.hasOwnProperty("eval") || (line.hasOwnProperty("refresh") && line.refresh === "true");

    return line;
}

function ansiToMarkup(aText) {
    let markup = "";

    let markupAttributes = {};

    let regex = new GLib.Regex("(\\e\\[([\\d;]*)m)", 0, 0);

    // GLib's Regex.split is a fantastic tool for tokenizing strings because of an important detail:
    // If the regular expression contains capturing groups, their matches are also returned.
    // Therefore, tokens will be an array of the form
    //   TEXT, [(FULL_ESC_SEQUENCE, SGR_SEQUENCE, TEXT), ...]
    let tokens = regex.split(aText, 0);

    let i = 0,
        iLen = tokens.length;
    for (; i < iLen; i++) {
        if (regex.match(tokens[i], 0)[0]) {
            // Default is SGR 0 (reset)
            let sgrSequence = (tokens[i + 1].length > 0) ? tokens[i + 1] : "0";
            let sgrCodes = sgrSequence.split(";");

            let j = 0,
                jLen = sgrCodes.length;
            for (; j < jLen; j++) {
                if (sgrCodes[j].length === 0) {
                    continue;
                }

                let code = parseInt(sgrCodes[j], 10);

                if (code === 0) {
                    // Reset all attributes
                    markupAttributes = {};
                } else if (code === 1) {
                    markupAttributes.font_weight = "bold";
                } else if (code === 3) {
                    markupAttributes.font_style = "italic";
                } else if (code === 4) {
                    markupAttributes.underline = "single";
                } else if (30 <= code && code <= 37) {
                    markupAttributes.color = ANSI_COLORS[code - 30];
                } else if (40 <= code && code <= 47) {
                    markupAttributes.bgcolor = ANSI_COLORS[code - 40];
                }
            }

            let textToken = tokens[i + 2];

            if (textToken.length > 0) {
                let attributeString = "";
                for (let attribute in markupAttributes) {
                    attributeString += " " + attribute + "='" + markupAttributes[attribute] + "'";
                }

                if (attributeString.length > 0) {
                    markup += "<span" + attributeString + ">" + textToken + "</span>";
                } else {
                    markup += textToken;
                }
            }

            // Skip processed tokens
            i += 2;

        } else {
            markup += tokens[i];
        }
    }

    return markup;
}

// Combines the benefits of spawn sync (easy retrieval of output)
// with those of spawn_async (non-blocking execution).
// Based on https://github.com/optimisme/gjs-examples/blob/master/assets/spawn.js.
function spawnWithCallback(aWorkingDirectory, aArgv, aEnvp, aFlags, aChildSetup, aCallback) {
    let [success, pid, stdinFile, stdoutFile, stderrFile] = // jshint ignore:line
    GLib.spawn_async_with_pipes(aWorkingDirectory, aArgv, aEnvp, aFlags, aChildSetup);

    if (!success) {
        return;
    }

    GLib.close(stdinFile);

    let standardOutput = "";

    let stdoutStream = new Gio.DataInputStream({
        base_stream: new Gio.UnixInputStream({
            fd: stdoutFile
        })
    });

    readStream(stdoutStream, function(aOutput) {
        if (aOutput === null) {
            stdoutStream.close(null);
            aCallback(standardOutput);
        } else {
            standardOutput += aOutput;
        }
    });

    let standardError = "";

    let stderrStream = new Gio.DataInputStream({
        base_stream: new Gio.UnixInputStream({
            fd: stderrFile
        })
    });

    readStream(stderrStream, function(aError) {
        if (aError === null) {
            stderrStream.close(null);

            if (standardError) {
                global.logError(standardError);
            }
        } else {
            standardError += aError;
        }
    });
}

function readStream(aStream, aCallback) {
    aStream.read_line_async(GLib.PRIORITY_LOW, null, function(aSource, aResult) {
        let [line] = aSource.read_line_finish(aResult);

        if (line === null) {
            aCallback(null);
        } else {
            aCallback(String(line) + "\n");
            readStream(aSource, aCallback);
        }
    });
}

/**
 * Compares two software version numbers (e.g. "1.7.1" or "1.2b").
 *
 * This function was born in http://stackoverflow.com/a/6832721.
 *
 * @param {string} v1 The first version to be compared.
 * @param {string} v2 The second version to be compared.
 * @param {object} [options] Optional flags that affect comparison behavior:
 * <ul>
 *     <li>
 *         <tt>lexicographical: true</tt> compares each part of the version strings lexicographically instead of
 *         naturally; this allows suffixes such as "b" or "dev" but will cause "1.10" to be considered smaller than
 *         "1.2".
 *     </li>
 *     <li>
 *         <tt>zeroExtend: true</tt> changes the result if one version string has less parts than the other. In
 *         this case the shorter string will be padded with "zero" parts instead of being considered smaller.
 *     </li>
 * </ul>
 * @returns {number|NaN}
 * <ul>
 *    <li>0 if the versions are equal</li>
 *    <li>a negative integer iff v1 < v2</li>
 *    <li>a positive integer iff v1 > v2</li>
 *    <li>NaN if either version string is in the wrong format</li>
 * </ul>
 *
 * @copyright by Jon Papaioannou (["john", "papaioannou"].join(".") + "@gmail.com")
 * @license This function is in the public domain. Do what you want with it, no strings attached.
 */
function versionCompare(v1, v2, options) {
    let lexicographical = options && options.lexicographical,
        zeroExtend = options && options.zeroExtend,
        v1parts = v1.split("."),
        v2parts = v2.split(".");

    function isValidPart(x) {
        return (lexicographical ? /^\d+[A-Za-z]*$/ : /^\d+$/).test(x);
    }

    if (!v1parts.every(isValidPart) || !v2parts.every(isValidPart)) {
        return NaN;
    }

    if (zeroExtend) {
        while (v1parts.length < v2parts.length) {
            v1parts.push("0");
        }
        while (v2parts.length < v1parts.length) {
            v2parts.push("0");
        }
    }

    if (!lexicographical) {
        v1parts = v1parts.map(Number);
        v2parts = v2parts.map(Number);
    }

    for (let i = 0; i < v1parts.length; ++i) {
        if (v2parts.length === i) {
            return 1;
        }

        if (v1parts[i] === v2parts[i]) {
            continue;
        } else if (v1parts[i] > v2parts[i]) {
            return 1;
        } else {
            return -1;
        }
    }

    if (v1parts.length !== v2parts.length) {
        return -1;
    }

    return 0;
}

function informAboutMissingDependencies(aMsg, aRes) {
    customNotify(
        _(XletMeta.name),
        aMsg + "\n" + "<b>" + aRes + "</b>" + "\n\n" +
        _("Check this applet help file for instructions."),
        "dialog-warning",
        NotificationUrgency.CRITICAL, [{
            label: _("Help"), // Just in case.
            tooltip: _("Open this applet help file."),
            callback: function() {
                // Use of launch_default_for_uri instead of executing "xdg-open"
                // asynchronously because most likely this is informing
                // of a failed command that could be "xdg-open".
                Gio.AppInfo.launch_default_for_uri(
                    "file://" + XletMeta.path + "/HELP.html",
                    null
                );
            }
        }]);
}

function customNotify(aTitle, aBody, aIconName, aUrgency, aButtons) {
    let icon = new St.Icon({
        icon_name: aIconName,
        icon_type: St.IconType.SYMBOLIC,
        icon_size: 24
    });
    let source = new MessageTray.SystemNotificationSource();
    Main.messageTray.add(source);
    let notification = new MessageTray.Notification(source, aTitle, aBody, {
        icon: icon,
        bodyMarkup: true,
        titleMarkup: true,
        bannerMarkup: true
    });
    notification.setTransient(aUrgency === NotificationUrgency.LOW);

    if (aUrgency !== NotificationUrgency.LOW && typeof aUrgency === "number") {
        notification.setUrgency(aUrgency);
    }

    try {
        if (aButtons && typeof aButtons === "object") {
            let destroyEmitted = function() {
                this.tooltip.destroy();
            };

            let i = 0,
                iLen = aButtons.length;
            for (; i < iLen; i++) {
                let btnObj = aButtons[i];
                try {
                    if (!notification._buttonBox) {

                        let box = new St.BoxLayout({
                            name: "notification-actions"
                        });
                        notification.setActionArea(box, {
                            x_expand: true,
                            y_expand: false,
                            x_fill: true,
                            y_fill: false,
                            x_align: St.Align.START
                        });
                        notification._buttonBox = box;
                    }

                    let button = new St.Button({
                        can_focus: true
                    });

                    if (btnObj.iconName) {
                        notification.setUseActionIcons(true);
                        button.add_style_class_name("notification-icon-button");
                        button.child = new St.Icon({
                            icon_name: btnObj.iconName,
                            icon_type: St.IconType.SYMBOLIC,
                            icon_size: 16
                        });
                    } else {
                        button.add_style_class_name("notification-button");
                        button.label = btnObj.label;
                    }

                    button.connect("clicked", btnObj.callback);

                    if (btnObj.tooltip) {
                        button.tooltip = new Tooltips.Tooltip(
                            button,
                            btnObj.tooltip
                        );
                        button.connect("destroy", Lang.bind(button, destroyEmitted));
                    }

                    if (notification._buttonBox.get_n_children() > 0) {
                        notification._buttonFocusManager.remove_group(notification._buttonBox);
                    }

                    notification._buttonBox.add(button);
                    notification._buttonFocusManager.add_group(notification._buttonBox);
                    notification._inhibitTransparency = true;
                    notification.updateFadeOnMouseover();
                    notification._updated();
                } catch (aErr) {
                    global.logError(aErr);
                    continue;
                }
            }
        }
    } finally {
        source.notify(notification);
    }
}

function escapeHTML(aStr) {
    aStr = String(aStr)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
    return aStr;
}

/*
exported parseLine,
         spawnWithCallback,
         informAboutMissingDependencies,
         escapeHTML
 */
