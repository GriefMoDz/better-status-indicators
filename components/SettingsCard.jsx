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

const { React, getModule, getModuleByDisplayName } = require('powercord/webpack');
const { Card, Clickable, Flex, Text } = require('powercord/components');
const { RightCaret } = require('./Icons');

const { default: Button } = getModule([ 'ButtonLink' ], false);

const classes = getModule([ 'card', 'clickable' ], false);
const IntegrationInfo = getModuleByDisplayName('IntegrationInfo', false) || (() => null);

class SettingsCard extends React.PureComponent {
  renderButton ({ buttonText, buttonDisabled, hasNextSection, onButtonClick }) {
    if (!buttonText || !onButtonClick) {
      return null;
    }

    if (hasNextSection) {
      return <Flex align={Flex.Align.CENTER}>
        <Text>{buttonText}</Text>
        {hasNextSection ? <RightCaret width={10} height={10} className={classes?.caret} /> : null}
      </Flex>;
    }

    return <Button
      size={Button.Sizes.SMALL}
      look={Button.Looks[hasNextSection ? 'LINK' : 'FILLED']}
      color={Button.Colors[hasNextSection ? 'PRIMARY' : 'BRAND']}
      disabled={buttonDisabled}
      onClick={onButtonClick}
    >
      {buttonText}
    </Button>;
  }

  render () {
    return <Flex>
      <IntegrationInfo {...this.props} />

      <Flex.Child shrink={0} grow={0}>
        <Flex align={Flex.Align.CENTER} justify={Flex.Justify.END}>
          {this.renderButton(this.props)}
        </Flex>
      </Flex.Child>
    </Flex>;
  }
}

module.exports = React.memo(props => {
  const [ focused, setFocused ] = React.useState(false);

  if (props.hasNextSection) {
    return <Clickable onClick={props.onButtonClick} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}>
      <Card editable={true} className={[ 'bsi-settings-card', classes?.card, classes?.clickable ].join(' ')}>
        <SettingsCard {...props} focused={focused} />
      </Card>
    </Clickable>;
  }

  return <Card editable={true} className={[ 'bsi-settings-card', classes?.card ].join(' ')}>
    <SettingsCard {...props} focused={focused} />
  </Card>;
});
