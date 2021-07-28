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
  constructor (plugin) {
    this.moduleDir = resolve(__dirname, '..', 'modules');
    this.modules = new Map();
    this.plugin = plugin;
  }

  get (moduleId) {
    return this.modules.get(moduleId);
  }

  getModules () {
    return [ ...this.modules.keys() ].filter(modId => !this.getHiddenModules().includes(modId));
  }

  getHiddenModules () {
    return [ ...this.modules.values() ].filter(mod => mod.manifest?.hidden).map(mod => mod.entityId);
  }

  isEnabled (moduleId) {
    return this.plugin.settings.get('enabledModules', []).includes(moduleId);
  }

  isHidden (moduleId) {
    return this.getHiddenModules().includes(moduleId);
  }

  mount (moduleId) {
    try {
      const ModuleClass = require(resolve(this.moduleDir, moduleId));

      Object.defineProperties(ModuleClass.prototype, {
        entityId: {
          get: () => moduleId,
          set: () => {
            throw new Error('Modules cannot update their ID at runtime!');
          }
        }
      });

      this.modules.set(moduleId, new ModuleClass(this.plugin));
    } catch (e) {
      console.error('%c[BetterStatusIndicators:Modules]', 'color: #f04747', `An error occurred while initializing "${moduleId}"!`, e);
    }
  }

  async unmount (moduleId) {
    const mod = this.get(moduleId);
    await mod._unload();

    Object.keys(require.cache).forEach(key => {
      if (key.includes(moduleId)) {
        delete require.cache[key];
      }
    });

    this.modules.delete(moduleId);
  }

  load (moduleId) {
    const mod = this.get(moduleId);
    mod._load();
  }

  unload (moduleId) {
    const mod = this.get(moduleId);
    mod._unload();
  }

  enable (moduleId) {
    this.plugin.settings.set('enabledModules', [
      ...this.plugin.settings.get('enabledModules', []),
      moduleId
    ]);

    this.load(moduleId);
  }

  disable (moduleId) {
    this.plugin.settings.set(
      'enabledModules',
      this.plugin.settings.get('enabledModules', []).filter(id => id !== moduleId)
    );

    this.unload(moduleId);
  }

  startModules () {
    readdirSync(this.moduleDir).forEach(filename => this.mount(filename));

    for (const mod of this.modules.values()) {
      if (this.isHidden(mod.entityId) || !this.isEnabled(mod.entityId)) {
        continue;
      }

      this.load(mod.entityId);
    }
  }

  async shutdownModules () {
    for (const mod of this.modules.keys()) {
      await this.unmount(mod);
    }
  }
};

module.exports = ModuleManager;
