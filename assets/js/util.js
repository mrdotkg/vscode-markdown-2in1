export const openLink = () => {
  const clickCallback = (e) => {
    let ele = e.target;
    e.stopPropagation();
    const isSpecial = ["dblclick", "auxclick"].includes(e.type);
    if (!isCompose(e) && !isSpecial) {
      return;
    }
    if (ele.tagName == "A") {
      handler.emit("openLink", ele.href);
    } else if (ele.tagName == "IMG") {
      const parent = ele.parentElement;
      if (parent?.tagName == "A" && parent.href) {
        handler.emit("openLink", parent.href);
        return;
      }
      const src = ele.src;
      if (src?.match(/http/)) {
        handler.emit("openLink", src);
      }
    }
  };
  const content = document.querySelector(".vditor-wysiwyg");
  content.addEventListener("click", (e) => {
    if (e.ctrlKey || e.metaKey) {
      clickCallback(e);
    }
  });
  document.querySelector(".vditor-ir").addEventListener("click", (e) => {
    if (e.ctrlKey || e.metaKey) {
      let ele = e.target;
      if (ele.classList.contains("vditor-ir__link")) {
        ele =
          e.target.nextElementSibling?.nextElementSibling?.nextElementSibling;
      }
      if (ele.classList.contains("vditor-ir__marker--link")) {
        handler.emit("openLink", ele.textContent);
      }
    }
  });
};

export const createContextMenu = (editor) => {
    const menu = document.getElementById('context-menu');
    
    if (!menu) {
        console.error('[Webview] Context menu element not found');
        return;
    }

    const groups = window.appState?.contextMenuGroups || {};
    const orderedEntries = ['other', 'formatting', 'headings', 'lists', 'blocks', 'tables']
        .filter(cat => groups[cat])
        .map(cat => [cat, groups[cat]]);
    
    if (orderedEntries.length === 0) {
        return;
    }

    menu.innerHTML = '';
    
    const categoryNames = {
        formatting: "Emphasis",
        headings: "Heading",
        lists: "List",
        tables: "Tables",
        blocks: "Blocks",
        other: "Other"
    };

    const multiLevelGroups = ['headings', 'formatting', 'lists', 'blocks', 'tables'];
    
    // Helper to create menu item element
    const createMenuItem = (item) => {
        const a = document.createElement('a');
        a.className = 'dropdown-item';
        a.href = '#';
        a.setAttribute('data-command', item.command);
        
        const titleSpan = document.createElement('span');
        titleSpan.textContent = item.title;
        a.appendChild(titleSpan);
        
        if (item.keybinding) {
            const keySpan = document.createElement('span');
            keySpan.className = 'keybinding';
            keySpan.textContent = item.keybinding;
            a.appendChild(keySpan);
        }
        
        a.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            menu.style.display = 'none';
            
            const command = a.getAttribute('data-command');
            if (typeof handler !== 'undefined') {
                handler.emit('command', command);
            }
        });
        
        return a;
    };

    orderedEntries.forEach(([category, items]) => {
        // Handle "other" category items directly without group wrapper
        if (category === 'other') {
            items.forEach((item) => menu.appendChild(createMenuItem(item)));
            
            // Add separator after "other" items
            if (orderedEntries.length > 1) {
                const separator = document.createElement('div');
                separator.className = 'context-menu-separator';
                menu.appendChild(separator);
            }
            return;
        }
        
        const group = document.createElement('div');
        group.className = 'menu-group';
        
        if (multiLevelGroups.includes(category)) {
            // Create collapsible multi-level group
            const titleContainer = document.createElement('div');
            titleContainer.className = 'menu-group-title submenu-toggle';
            
            const titleText = document.createElement('span');
            titleText.textContent = categoryNames[category] || category;
            titleContainer.appendChild(titleText);
            
            // Add arrow indicator
            const arrow = document.createElement('span');
            arrow.className = 'submenu-arrow';
            arrow.textContent = '›';
            titleContainer.appendChild(arrow);
            
            group.appendChild(titleContainer);
            
            // Create submenu container
            const submenu = document.createElement('ul');
            submenu.className = 'submenu';
            
            items.forEach((item) => {
                const li = document.createElement('li');
                li.appendChild(createMenuItem(item));
                submenu.appendChild(li);
            });
            
            group.appendChild(submenu);
            
            // Position submenu on hover (left or right based on available space)
            titleContainer.addEventListener('mouseenter', () => {
                showSubmenu(submenu, titleContainer);
            });
            
            titleContainer.addEventListener('mouseleave', () => {
                scheduleSubmenuHide(submenu);
            });
            
            // Keep submenu visible when hovering over it
            submenu.addEventListener('mouseenter', () => {
                clearTimeout(currentSubmenuHideTimeout);
            });
            
            submenu.addEventListener('mouseleave', () => {
                scheduleSubmenuHide(submenu);
            });
        } else {
            // Create regular flat group with separator
            const separator = document.createElement('div');
            separator.style.height = '1px';
            separator.style.backgroundColor = 'var(--vscode-menu-border, #3e3e42)';
            separator.style.margin = '4px 0';
            group.appendChild(separator);
            
            const itemsList = document.createElement('ul');
            itemsList.className = 'menu-group-items';
            
            items.forEach((item) => {
                const li = document.createElement('li');
                const a = document.createElement('a');
                a.className = 'dropdown-item';
                a.href = '#';
                a.setAttribute('data-command', item.command);
                
                const titleSpan = document.createElement('span');
                titleSpan.textContent = item.title;
                a.appendChild(titleSpan);
                
                if (item.keybinding) {
                    const keySpan = document.createElement('span');
                    keySpan.className = 'keybinding';
                    keySpan.textContent = item.keybinding;
                    a.appendChild(keySpan);
                }
                
                a.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    menu.style.display = 'none';
                    
                    const command = a.getAttribute('data-command');
                    console.log('[Webview] Command clicked:', command);
                    
                    if (typeof handler !== 'undefined') {
                        handler.emit('command', command);
                    }
                });
                
                li.appendChild(a);
                itemsList.appendChild(li);
            });
            
            group.appendChild(itemsList);
        }
        
        menu.appendChild(group);
    });

    // Helper function to position menu within viewport
    const positionMenu = (pageX, pageY) => {
        menu.style.display = 'block';
        menu.style.maxHeight = 'none'; // Reset to measure full height
        
        // Use clientX/Y for positioning
        let x = pageX;
        let y = pageY;
        
        // Temporarily show to measure
        menu.style.visibility = 'hidden';
        menu.style.top = '0px';
        menu.style.left = '0px';
        
        setTimeout(() => {
            const menuRect = menu.getBoundingClientRect();
            const windowWidth = window.innerWidth;
            const windowHeight = window.innerHeight;
            const padding = 10;
            const scrollbarWidth = 17; // Standard scrollbar width
            
            // Adjust horizontal position (account for scrollbar width)
            const menuWidthWithScrollbar = menuRect.width + scrollbarWidth;
            if (x + menuWidthWithScrollbar > windowWidth) {
                x = Math.max(padding, windowWidth - menuWidthWithScrollbar - padding);
            } else {
                x = Math.max(padding, x);
            }
            
            // Calculate available space below and above cursor
            const spaceBelow = windowHeight - y;
            const spaceAbove = y;
            
            // Determine if menu should open above or below
            let finalY = y;
            let maxHeight;
            
            if (spaceBelow > spaceAbove && spaceBelow > menuRect.height) {
                // Open below with available space
                maxHeight = spaceBelow - padding;
            } else if (spaceAbove > menuRect.height) {
                // Open above
                finalY = Math.max(padding, y - menuRect.height);
                maxHeight = spaceAbove - padding;
            } else {
                // Not enough space either way, use available space
                if (spaceBelow > spaceAbove) {
                    maxHeight = spaceBelow - padding;
                } else {
                    finalY = Math.max(padding, y - spaceAbove);
                    maxHeight = spaceAbove - padding;
                }
            }
            
            menu.style.top = finalY + 'px';
            menu.style.left = x + 'px';
            menu.style.maxHeight = Math.max(100, maxHeight) + 'px'; // Min 100px
            menu.style.visibility = 'visible';
        }, 0);
    };

    // Context menu event listener
    document.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        positionMenu(e.clientX, e.clientY);
    });

    // Close on outside click
    document.addEventListener('mousedown', (e) => {
        if (!menu.contains(e.target)) {
            menu.style.display = 'none';
        }
    });

    // Close on escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            menu.style.display = 'none';
        }
    });

    // Close menu when window loses focus
    window.addEventListener('blur', () => {
        menu.style.display = 'none';
    });
    
    // Global timeout for submenu hiding
    let currentSubmenuHideTimeout;
    let currentVisibleSubmenu = null;
    
    // Helper function to hide all submenus
    const hideAllSubmenus = () => {
        clearTimeout(currentSubmenuHideTimeout);
        if (currentVisibleSubmenu) {
            currentVisibleSubmenu.style.display = 'none';
            currentVisibleSubmenu = null;
        }
    };
    
    // Helper function to show and position submenu
    const showSubmenu = (submenu, titleContainer) => {
        clearTimeout(currentSubmenuHideTimeout);
        
        // Hide previous submenu immediately
        if (currentVisibleSubmenu && currentVisibleSubmenu !== submenu) {
            currentVisibleSubmenu.style.display = 'none';
        }
        
        submenu.style.display = 'block';
        currentVisibleSubmenu = submenu;
        
        // Position submenu with boundary checks
        const titleRect = titleContainer.getBoundingClientRect();
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        const submenuWidth = 280;
        const scrollbarWidth = 17; // Standard scrollbar width
        const padding = 10;
        
        // Calculate horizontal position
        let left;
        const spaceOnRight = windowWidth - titleRect.right;
        
        if (spaceOnRight >= submenuWidth + scrollbarWidth + padding) {
            // Enough space on right
            left = titleRect.right + 2;
        } else {
            // Not enough space on right, position on left with minimal gap
            left = Math.max(padding, titleRect.left - submenuWidth - 2);
        }
        
        // Calculate vertical position (align with title, but adjust if goes off-screen)
        let top = titleRect.top;
        
        // Check if submenu would go below viewport
        const estimatedSubmenuHeight = 300; // Approximate max height
        if (top + estimatedSubmenuHeight > windowHeight) {
            // Adjust to fit within viewport
            top = Math.max(padding, windowHeight - estimatedSubmenuHeight - padding);
        }
        
        submenu.style.left = left + 'px';
        submenu.style.top = top + 'px';
    };
    
    // Helper function to schedule submenu hiding
    const scheduleSubmenuHide = (submenu) => {
        clearTimeout(currentSubmenuHideTimeout);
        currentSubmenuHideTimeout = setTimeout(() => {
            if (currentVisibleSubmenu === submenu) {
                submenu.style.display = 'none';
                currentVisibleSubmenu = null;
            }
        }, 150);
    };
};

export const addScrollListener = () => {
  const possibleContainers = [
    ".vditor-reset",
    ".vditor-ir .vditor-reset",
    ".vditor-wysiwyg .vditor-reset",
    ".vditor-ir__preview",
    ".vditor-ir",
    ".vditor",
  ];

  let scrollContainer = null;
  for (const selector of possibleContainers) {
    scrollContainer = document.querySelector(selector);
    if (scrollContainer) {
      break;
    }
  }

  if (!scrollContainer) {
    setTimeout(addScrollListener, 100);
    return;
  }

  if (typeof handler === "undefined" || handler === null) {
    return;
  }

  let lastScrollTime = 0;
  scrollContainer.addEventListener("scroll", (e) => {
    const now = Date.now();
    if (now - lastScrollTime < 50) return;
    lastScrollTime = now;

    const scrollTop = e.target.scrollTop - 70;
    handler.emit("scroll", { scrollTop });
  });

  let lastWindowScrollTime = 0;
  window.addEventListener("scroll", (e) => {
    const now = Date.now();
    if (now - lastWindowScrollTime < 50) return;
    lastWindowScrollTime = now;

    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    handler.emit("scroll", { scrollTop: scrollTop - 70 });
  });
};

export function scrollEditor(top) {
  if (!top || top <= 0) {
    return;
  }

  const tryWindowScroll = () => {
    window.scrollTo({ top: top + 70, behavior: "auto" });

    setTimeout(() => {
      const currentScroll =
        window.pageYOffset || document.documentElement.scrollTop;
      if (Math.abs(currentScroll - (top + 70)) > 5) {
        document.documentElement.scrollTop = top + 70;
        document.body.scrollTop = top + 70;
      }
    }, 100);
  };

  const scrollHack = setInterval(() => {
    const editorContainer = document.querySelector(".vditor-reset");
    if (!editorContainer) {
      tryWindowScroll();
      clearInterval(scrollHack);
      return;
    }

    editorContainer.scrollTo({ top, behavior: "auto" });

    tryWindowScroll();

    clearInterval(scrollHack);
  }, 10);
}

export const imageParser = (viewAbsoluteLocal) => {
  if (!viewAbsoluteLocal) return;
  var observer = new MutationObserver((mutationList) => {
    for (var mutation of mutationList) {
      for (var node of mutation.addedNodes) {
        if (!node.querySelector) continue;
        const imgs = node.querySelectorAll("img");
        for (const img of imgs) {
          const url = img.src;
          if (url.startsWith("http")) {
            continue;
          }
          if (
            url.startsWith("vscode-webview-resource") ||
            url.includes("file:///")
          ) {
            img.src = `https://file+.vscode-resource.vscode-cdn.net/${
              url.split("file:///")[1]
            }`;
          }
        }
      }
    }
  });
  observer.observe(document, {
    childList: true,
    subtree: true,
  });
};

export const preventBlurPropagation = () => {
  document.getElementById('editor').addEventListener(
    "blur",
    (event) => {
      event.stopPropagation();
      event.preventDefault();

      if (window.vditor && window.vditor.currentMode === "ir") {
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
          window.vditor.ir.range = selection.getRangeAt(0);
        }
      }

      return false;
    },
    true
  );
};

export function setupFocusManagement() {
  let editorState = {
    cursorPosition: null,
    selection: null,
    hasFocus: false,
    savedRange: null,
    wasEditing: false,
  };

  function getIRSelection() {
    if (window.vditor && window.vditor.currentMode === "ir") {
      const selection = window.getSelection();
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const irElement = document.querySelector(".vditor-ir .vditor-reset");

        if (
          irElement &&
          (irElement.contains(range.startContainer) ||
            irElement.contains(range.endContainer))
        ) {
          return {
            startContainer: range.startContainer,
            startOffset: range.startOffset,
            endContainer: range.endContainer,
            endOffset: range.endOffset,
            collapsed: range.collapsed,
          };
        }
      }
    }
    return null;
  }

  function setIRSelection(rangeData) {
    if (rangeData && window.vditor && window.vditor.currentMode === "ir") {
      try {
        const range = document.createRange();
        range.setStart(rangeData.startContainer, rangeData.startOffset);
        range.setEnd(rangeData.endContainer, rangeData.endOffset);

        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);

        if (window.vditor.ir) {
          window.vditor.ir.range = range;
        }

        return true;
      } catch (e) {
        return false;
      }
    }
    return false;
  }

  function saveState() {
    if (!window.vditor) return;

    try {
      editorState.cursorPosition = window.vditor.getCursorPosition();
      editorState.selection = getIRSelection();
      editorState.hasFocus =
        document.activeElement?.closest(".vditor-ir") !== null;

      if (window.vditor.ir && window.vditor.ir.range) {
        editorState.savedRange = window.vditor.ir.range.cloneRange();
      }
    } catch (e) {}
  }

  function restoreState() {
    if (!window.vditor) return;

    try {
      window.vditor.focus();

      if (window.vditor.currentMode === "ir") {
        setTimeout(() => {
          let restored = false;

          if (editorState.selection) {
            restored = setIRSelection(editorState.selection);
          }

          if (!restored && editorState.savedRange) {
            try {
              const selection = window.getSelection();
              selection.removeAllRanges();
              selection.addRange(editorState.savedRange);
              if (window.vditor.ir) {
                window.vditor.ir.range = editorState.savedRange;
              }
              restored = true;
            } catch (e) {}
          }

          if (!restored) {
            window.vditor.focus();
          }
        }, 10);
      }

      setTimeout(() => {
        if (window.vditor && window.vditor.currentMode === "ir") {
          const irElement = document.querySelector(".vditor-ir .vditor-reset");
          if (irElement) {
            window.vditor.focus();
            irElement.focus();

            setTimeout(() => {
              if (document.activeElement !== irElement) {
                irElement.click();
                irElement.focus();
              }
            }, 20);
          }
        }
      }, 100);

      if (window.vditor && window.vditor.currentMode === "ir") {
        setTimeout(() => {
          const irElement = document.querySelector(".vditor-ir .vditor-reset");
          if (irElement) {
            try {
              const clickEvent = new MouseEvent("click", {
                bubbles: true,
                cancelable: true,
                view: window,
              });
              irElement.dispatchEvent(clickEvent);

              const inputEvent = new Event("input", {
                bubbles: true,
                cancelable: true,
              });
              irElement.dispatchEvent(inputEvent);

              if (irElement.contentEditable) {
                irElement.setAttribute("contenteditable", "true");
                irElement.focus();
              }
            } catch (e) {}
          }
        }, 80);
      }
    } catch (e) {}
  }

  window.addEventListener("blur", () => {
    saveState();
  });

  window.addEventListener("focus", () => {
    setTimeout(restoreState, 50);
  });
}