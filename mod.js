function ColorDetector (image) {
  this.color = { r: 0, g: 0, b: 0 };
  this.image = image;
}
[
  function componentToHex (c) {
    var hex = Math.max(Math.min(c, 255), 0).toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  },

  function getHexColor (offset) {
    if (!offset) {
      offset = { r: 0, g: 0, b: 0 };
    }
    return "#" +
      this.componentToHex(this.color.r + offset.r) +
      this.componentToHex(this.color.g + offset.g) +
      this.componentToHex(this.color.b + offset.b);
  },

  function detect () {
    return new Promise((resolve) => {
      let blockSize = 5;
      const canvas = document.createElement("canvas");
      const context = canvas.getContext && canvas.getContext("2d");
      let data; let width; let height;
      let i = -4;
      let rgb = { r: 0, g: 0, b: 0 };
      let length;
      let count = 0;
      if (!context) {
        console.warn("can't get context of avatar");
        resolve(this.color);
        return;
      }

      height = canvas.height = this.image.naturalHeight || this.image.offsetHeight || this.image.height;
      width = canvas.width = this.image.naturalWidth || this.image.offsetWidth || this.image.width;

      context.drawImage(this.image, 0, 0);

      try {
        data = context.getImageData(0, 0, width, height);
      } catch (e) {
        console.error("can't get image data");
        console.error(e);
        resolve(this.color);
        return;
      }

      length = data.data.length;

      while ((i += blockSize * 4) < length) {
        ++count;
        rgb.r += data.data[i];
        rgb.g += data.data[i + 1];
        rgb.b += data.data[i + 2];
      }

      this.color.r = ~~(rgb.r / count);
      this.color.g = ~~(rgb.g / count);
      this.color.b = ~~(rgb.b / count);

      resolve(this.color);
    });
  }
].forEach((fn) => { ColorDetector.prototype[fn.name] = fn; });

function PleromaCat (handle, type) {
  this.type = type || "cat";
  this.handle = handle;
  this.colors = {
    backgroundColor: "#000000",
    borderColor: "#000000"
  };
  this.config = {
    "nya": {
      enabled: true,
      matcher: "(^|\s|>)な+(\s|<|$)", // eslint-disable-line no-useless-escape
      replacer: {
        source: "な",
        dest: "にゃ"
      }
    }
  };
  this.loadConfig();
}
[
  function loadConfig () {
    const json = PleromaModCatify.config;
    if (!json.nya) {
      return;
    }
    this.config.nya.enabled = json.nya.enabled;
    if (this.config.nya.enabled) {
      this.config.nya.matcher = json.nya.matcher || this.config.nya.matcher;
      this.config.nya.replacer.source = json.nya.replacer.source || this.config.nya.replacer.source;
      this.config.nya.replacer.dest = json.nya.replacer.dest || this.config.nya.replacer.dest;
    }
  },

  function getClassName () {
    return "USER____" + this.handle.replace(/@/g, "_AT_").replace(/\./g, "_");
  },

  function makeCat (element) {
    if (!element) {
      element = document;
    }
    if (element.querySelectorAll) {
      var posts = element.querySelectorAll("." + this.getClassName());
      this.makeCatByClassName("user-info");
      this.makeCatByClassName("basic-user-card", "basic-user-card-screen-name");
      for (const currentPost of posts) {
        this.makeCatByElement(currentPost);
        this.nyaByPost(currentPost);
      }
    }
  },

  function makeCatByClassName (className, usernameClass) {
    if (!className) {
      className = "user-info";
    }
    if (!usernameClass) {
      usernameClass = "user-screen-name";
    }
    const userinfos = document.querySelectorAll("." + className);
    for (const infoIndex in userinfos) {
      if (userinfos[infoIndex].querySelector && !/cat$/.test(userinfos[infoIndex].innerText)) {
        const handle = userinfos[infoIndex].querySelector("." + usernameClass);
        const regexHandle = new RegExp(this.handle, "i");
        if (handle) {
          if (regexHandle.test(handle.innerText)) {
            this.makeCatByElement(userinfos[infoIndex]);
          }
        }
      }
    }
  },

  function makeCatByElement (element) {
    if (element.querySelectorAll) {
      element.classList.add("catified");
      element.classList.add(this.type);
      const avatars = element.querySelectorAll(".Avatar");
      for (const avatarIndex in avatars) {
        const currentAvatar = avatars[avatarIndex];
        if (currentAvatar.style) {
          if (this.colors.borderColor === "#000000") {
            this.detectColors(currentAvatar);
          }
          currentAvatar.style.backgroundColor = this.colors.backgroundColor;
          currentAvatar.style.borderColor = this.colors.borderColor;
        }
      }
    }
  },

  function nyaByPost (element) {
    if (element.querySelectorAll && this.config.nya.enabled && element.classList.contains("cat")) {
      const contents = element.querySelectorAll(".status-content");
      for (const content of contents) {
        if (content.innerHTML) {
          const regex = new RegExp(this.config.nya.matcher, "g");
          let match;
          while ((match = regex.exec(content.innerHTML)) !== null) {
            const source = match[0];
            const dest = source.replace(
              new RegExp(this.config.nya.replacer.source, "g"),
              this.config.nya.replacer.dest
            );
            content.innerHTML = content.innerHTML.replace(source, dest);
          }
        }
      }
    }
  },

  function detectColors (avatarElement) {
    const images = avatarElement.querySelectorAll("img");
    for (const imageIndex in images) {
      images[imageIndex].crossOrigin = "anonymous";
      const colorAvatar = () => {
        const detector = new ColorDetector(images[imageIndex]);
        detector.detect().then((color) => {
          this.colors.backgroundColor = detector.getHexColor();
          this.colors.borderColor = detector.getHexColor({ r: -40, g: -40, b: -40 });
          avatarElement.style.backgroundColor = this.colors.backgroundColor;
          avatarElement.style.borderColor = this.colors.borderColor;
        });
      };
      if (images[imageIndex].complete) {
        colorAvatar();
      } else {
        images[imageIndex].onload = colorAvatar;
      }
      return;
    }
  }
].forEach((fn) => { PleromaCat.prototype[fn.name] = fn; });

function PleromaModCatify () {
  this.animals = {};
  this.config = {
    stylesheet: "style.css",
    triggers: {
      cat: {
        displayName: [
          "🐱",
          "😺",
          "🐈",
          "😼",
          "😹",
          "にゃ",
          "cat",
          "mew",
          "meow",
          "nya",
          "miaou",
          "kitten",
          "kitn",
          "ktn",
          "kadse",
          "catte"
        ],
        instances: [
          "misskey.io"
        ]
      },
      bear: {
        displayName: [
          "🐻",
          "tf2",
          "romaboo"
        ],
        instances: []
      },
      bob: {
        displayName: [
          "eris",
          "bob"
        ],
        instances: [
          "disqordia.space"
        ],
      },
      rabbit: {
        displayName: [
            "🐰",
            "🐇",
            "rabbit",
            "bunny",
            "hase",
            "häschen",
            "kaninchen"
        ],
        instances: []
      }
    },
    filter: [
      "user-info",
      "timeline",
      "Conversation",
      "panel-body",
      "main",
      "active",
      "status-body"
    ]
  };

  this.loadConfig();
}
[
  function loadConfig () {
    window.fetch(PleromaModLoader.getModDir() + "pleroma-mod-catify/config.json").then((response) => {
      if (response.ok) {
        response.json().then((json) => {
          PleromaModCatify.config = json;
          for (const type in json.triggers) {
            this.config.triggers[type] = {};
            this.config.triggers[type].displayName = json.triggers[type].displayName || [];
            this.config.triggers[type].instances = json.triggers[type].instances || [];
          }
        }).catch((error) => {
          console.error("can't parse catify config");
          console.error(error);
        });
      }
    }).catch((error) => {
      console.warn("can't load catify config");
      console.warn(error);
    });
  },

  function onMutation (mutation, observer) {
    if (mutation.target.classList.contains("user-info")) {
      mutation.target.classList.remove("catified");
      for (const type in this.config.triggers) {
        mutation.target.classList.remove(type);
      }
    }
    this.detectCats();
    for (const element of mutation.addedNodes) {
      this.catify(element);
    }
  },

  function onReady () {
    this.areYouACat();
    this.detectCats();
    this.catify();
  },

  function onDestroy () {
    const allCats = document.querySelectorAll(".catified");
    for (const cat of allCats) {
      cat.classList.remove("catified");
      for (const type in this.config.triggers) {
        cat.classList.remove(type);
      }
    }
  },

  function run () {
    PleromaModLoader.includeModCss("pleroma-mod-catify/" + this.config.stylesheet);
  },

  function addCat (handle, type) {
    if (type == null) {
      type = "cat";
    }
    handle = handle.trim();
    if (!this.animals[handle]) {
      this.animals[handle] = new PleromaCat(handle, type);
    }
  },

  function areYouACat () {
    const profile = document.querySelector(".user-card");
    for (const type in this.config.triggers) {
      const pattern = this.config.triggers[type].displayName.join("|");
      const regex = new RegExp(pattern, "i");
      if (profile) {
        const username = profile.querySelector(".user-name");
        if (username) {
          if (regex.test(username.innerText)) {
            const accountName = profile.querySelector(".user-screen-name");
            if (accountName) {
              this.addCat(accountName.innerText.substring(1), type);
            }
          }
        }
      }
    }
  },

  function detectCatsByClassName (classname, usernameClass, accountnameClass) {
    classname = classname || "status-container";
    usernameClass = usernameClass || "status-username";
    accountnameClass = accountnameClass || "account-name";
    const nameAndAccountNames = document.querySelectorAll("." + classname);
    for (const type in this.config.triggers) {
      const regexName = new RegExp(this.config.triggers[type].displayName.join("|"), "i");
      const regexInstance = new RegExp(this.config.triggers[type].instances.join("|"), "i");
      for (const currentAccount of nameAndAccountNames) {
        if (currentAccount.querySelector) {
          let isCat = false;
          const username = currentAccount.querySelector("." + usernameClass);
          if (username && this.config.triggers[type].displayName.length > 0) {
            isCat = regexName.test(username.innerText);
          }
          const account = currentAccount.querySelector("." + accountnameClass);
          if (account) {
            const handle = account.innerText;
            if (this.config.triggers[type].instances.length > 0) {
              isCat = isCat || regexInstance.test(handle);
            }
            if (isCat) {
              this.addCat(handle, type);
            }
          }
        }
      }
    }
  },

  function detectCats () {
    this.detectCatsByClassName("status-container");
    this.detectCatsByClassName("basic-user-card", "basic-user-card-user-name-value", "basic-user-card-screen-name");
  },

  function catify (element) {
    for (const catKey in this.animals) {
      this.animals[catKey].makeCat(element);
    }
  }
].forEach((fn) => { PleromaModCatify.prototype[fn.name] = fn; });

PleromaModLoader.registerMod(PleromaModCatify);
