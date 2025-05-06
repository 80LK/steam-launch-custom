<p align="center">
  <img src="public/logo.png" alt="Logo" height=170/>
</p>

# Steam-Launcher-Custom

Add your own launch options for your steam games.

## Usage

1. Download [latest release](https://github.com/80LK/steam-launch-custom/releases/latest)
2. Open the app and wait for the games to be scanned
3. After scanning, you will see a window with all the installed games.
![Page with games](./md/games.png) 

### Configuration
The configuration changes the Steam files to run **steam-launch-custom** to intercept the launch of the game and open a window with launch options.

1. Open the app and select a game
2. In the window that opens, click the "CONFIGURE" button

![Page with no configured game](./md/game_no_configure.png)

3. To reset the configuration, click on the round red button with a cross.

![Page with no configured game](./md/reset_configure.png)

4. Changing the configuration status requires overwriting the Steam files and restarting it.  To do this, go back to the games page using the left arrow. You will see a notification saying "You need to close Steam and rewrite launch options". Click on the "NOW" button

![Need configure Steam](./md/need_rewrite.png)

### Add launchs
1. Open the app and select a game
2. To add a launch option, you need to [configure](#Configuration) the game.
3. Click on the round green button with a plus to add a new launch option.

![Add new launch](./md/add_launch.png)

4. In the window that opens, specify the name of the option, the executable file, the startup parameters, and the working directory, if necessary. Click on the "SAVE" button

![Window for add new launch](./md/window_add_launch.png)

5. To remove a launch option, click the trash icon next to the desired one.

![Remove launch](./md/remove_launch.png)

6. To modify a launch option, click the pencil icon next to the desired one.

![Edit launch](./md/edit_launch.png)

### Launching games
1. After [configuring](#Configuration) and [adding launch](#Add-launchs), you can launch the game in several ways.
    - Launch the game using Steam
    - Launch the game using **steam-launch-custom** select the game and click on the "LAUNCH" button. The game will still be launched via Steam, as the `steam//rungameid/{app_id}` request is being processed
2. To launch the game, click on the "LAUNCH" button next to the desired one. The first launch option is the original game that Steam is trying to launch.

![Variant launchs](./md/variants_launchs.png)

3. To cancel the launch, click on the "CANCEL" button


## Links
[![TELEGRAM](https://img.shields.io/badge/Telegram-2AABEE?logo=telegram&logoColor=white
)](https://t.me/steam_launch_custom)
[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2F80LK%2Fsteam-launch-custom.svg?type=shield&issueType=license)](https://app.fossa.com/projects/git%2Bgithub.com%2F80LK%2Fsteam-launch-custom?ref=badge_shield&issueType=license)
[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2F80LK%2Fsteam-launch-custom.svg?type=shield&issueType=security)](https://app.fossa.com/projects/git%2Bgithub.com%2F80LK%2Fsteam-launch-custom?ref=badge_shield&issueType=security)
