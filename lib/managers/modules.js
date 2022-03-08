/**
 * NOTICE OF LICENSE
 *
 * This source file is subject to the Open Software License (OSL 3.0)
 * that is bundled with this plugin in the file LICENSE.md.
 * It is also available through the world-wide-web at this URL:
 * https://opensource.org/licenses/OSL-3.0
 *
 * DISCLAIMER
 *
 * Do not edit or add to this file if you wish to upgrade the plugin to
 * newer versions in the future. If you wish to customize the plugin for
 * your needs please document your changes and make backups before you update.
 *
 *
 * @copyright Copyright (c) 2020-2021 GriefMoDz
 * @license   OSL-3.0 (Open Software License ("OSL") v. 3.0)
 * @link      https://github.com/GriefMoDz/better-status-indicators
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

const { resolve } = require('path');
const { readdirSync } = require('fs');

class ModuleManager {
  constructor (main) {
    this.moduleDir = resolve(__dirname, '..', '..', 'modules');
    this.settings = main._settings;
    this.modules = new Map();
    this.main = main;
  }

  get (moduleID) {
    return this.modules.get(moduleID);
  }

  getModules () {
    return [ ...this.modules.keys() ].filter(moduleID => !this.getHiddenModules().includes(moduleID));
  }

  getHiddenModules () {
    return [ ...this.modules.values() ].filter(mod => mod.manifest?.hidden).map(mod => mod.entityID);
  }

  isEnabled (moduleID) {
    return this.settings.getSetting('enabledModules', []).includes(moduleID);
  }

  isHidden (moduleID) {
    return this.getHiddenModules().includes(moduleID);
  }

  mount (moduleID) {
    try {
      const ModuleClass = require(resolve(this.moduleDir, moduleID));

      Object.defineProperties(ModuleClass.prototype, {
        entityID: {
          get: () => moduleID,
          set: () => {
            throw new Error('Modules cannot update their ID at runtime!');
          }
        }
      });

      this.modules.set(moduleID, new ModuleClass(this.main));
    } catch (e) {
      console.error('%c[BetterStatusIndicators:Modules]', 'color: #f04747', `An error occurred while initializing "${moduleID}"!`, e);
    }
  }

  async unmount (moduleID) {
    const mod = this.get(moduleID);
    await mod._unload();

    Object.keys(require.cache).forEach(key => {
      if (key.includes(moduleID)) {
        delete require.cache[key];
      }
    });

    this.modules.delete(moduleID);
  }

  load (moduleID) {
    const mod = this.get(moduleID);
    mod._load();
  }

  unload (moduleID) {
    const mod = this.get(moduleID);
    mod._unload();
  }

  enable (moduleID) {
    this.settings.updateSetting('enabledModules', [
      ...this.settings.getSetting('enabledModules', []),
      moduleID
    ]);

    this.load(moduleID);
  }

  disable (moduleID) {
    this.settings.updateSetting(
      'enabledModules',
      this.settings.getSetting('enabledModules', []).filter(id => id !== moduleID)
    );

    this.unload(moduleID);
  }

  toggle (moduleID) {
    if (this.isEnabled(moduleID)) {
      this.disable(moduleID);
    } else {
      this.enable(moduleID);
    }
  }

  startModules () {
    for (const filename of readdirSync(this.moduleDir)) {
      this.mount(filename);

      const mod = this.modules.get(filename);

      if (!this.isHidden(mod.entityID) && this.isEnabled(mod.entityID)) {
        this.load(mod.entityID);
      }
    }
  }

  async shutdownModules () {
    for (const moduleID of this.modules.keys()) {
      await this.unmount(moduleID);
    }
  }
};

module.exports = ModuleManager;
