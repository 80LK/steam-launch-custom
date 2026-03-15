<p align="center">
  <img src="public/logo.png" alt="Logo" height=170/>
  <br/>
  [ <a href="./README.md">EN</a> | <span style="font-weight:bold">RU</span> ]
</p>

# Steam-Launcher-Custom

Добавьте собственные параметры запуска для своих игр в Steam.

## Использование

1. Скачайте [последний релиз](https://github.com/80LK/steam-launch-custom/releases/latest)
2. Откройте приложение и дождитесь сканирования игр
3. После сканирования вы увидите список всех установленных игр.
![Страница с играми](./md/games.png) 

### Конфигурация
Конфигурация изменяет файлы Steam, чтобы при запуске **steam-launch-custom** перехватывался запуск игры и открывалось окно с параметрами запуска.

1. Откройте приложение и выберите игру
2. В открывшемся окне нажмите кнопку **"НАСТРОИТЬ"**

![Страница без настроенной игры](./md/game_no_configure.png)

3. Чтобы сбросить настройки, нажмите на круглую красную кнопку с крестиком.

![Страница игры без вариантов запуска](./md/reset_configure.png)

4. Чтобы изменить статус конфигурации, необходимо перезаписать файлы Steam и перезапустить его. Для этого вернитесь на страницу игр с помощью стрелки влево. Вы увидите уведомление «Вам нужно закрыть Steam и перезаписать параметры запуска». Нажмите кнопку **"СЕЙЧАС"**

![Необходимо сконфигурировать Steam](./md/need_rewrite.png)

### Добавить варианты запусков
1. Откройте приложение и выберите игру
2. Чтобы добавить параметр запуска, необходимо [настроить](#Configuration) игру.
3. Нажмите на круглую зеленую кнопку со знаком "плюс", чтобы добавить новый вариант запуска.

![Добавить новый вариант запуска](./md/add_launch.png)

4. В открывшемся окне укажите название варианта, исполняемый файл, параметры запуска и, при необходимости, рабочий каталог. Нажмите кнопку "СОХРАНИТЬ"

![Окно добавления нового варианат запуска](./md/window_add_launch.png)

5. Чтобы удалить вариант запуска, нажмите на значок корзины рядом с нужным вариантом.

![Удалить вариант запуска](./md/remove_launch.png)

6. Чтобы изменить параметр запуска, нажмите на значок карандаша рядом с нужным параметром.

![Изменить вариант запуска](./md/edit_launch.png)

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
