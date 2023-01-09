# better-theme-switcher

An extended re-implementation of GNOME's dark theme switcher

## What is this?
This is my own re-implementation of GNOME's dark theme switcher. It operates similarly to theme
default theme switcher, but with added support for:

* Wallpaper switching
* Custom cursors
* Custom themes (gradience and legacy gtk-3 themes)
* Shell theme switching

These features can be easily extended without changing the program's code.

## How does it work?
This program uses a sort of "snapshot" system that runs ontop of gsettings.


When you want to set the light/dark theme, configure your theme how you like
and run the program with either the `--setup-light` or `--setup-dark` flags. 

This will
save the settings specified in `targets` under either the light or dark theme.

These settings are restored when their respective theme is activated.

## Getting set up
When you first run this program, it will fail saying that you need to set up the themes.
This is normal.

### Configuring targets
To customize what settings this program saves, edit the `targets` file in `$HOME/.config/better-theme-switcher/targets`.


Each line corresponds to a property in `gsettings`. The ones there by default are usually enough to
cover most customizations, but you can add/remove whatever you wish.

### Creating themes
Next, set up your desktop how you want it to look in it's light/dark theme (wallpaper, gtk theme, cursor, etc).
Once you're done, run `better-theme-switcher --setup-[dark/light]`. This will save your
current configuration under them theme you specified. Do this again for the other theme.

### Thats it
There really isnt much else to do aside from adding the program to startup if you want.

# Installing
Currently the only way to install this program is to build it from it's source. I plan to add it to
the AUR soon!

## Building from source
### Getting the code
Download the code using git 
```bash
git clone whatever.git
cd whatever
```

### Dependencies
#### System
Make sure you have `nodejs` `npm` and `make` installed.

Arch:
```bash
(as root) pacman -S nodejs npm
```
Debian / Debian derivatives:
```bash
(as root) apt install nodejs npm
```
#### NPM
Once in the repo's root, run:
```bash
npm i
```
### Building
To build the code, run:
```bash
make build
```
This should make an executable in the Builds folder.

# Licensing
This project is free and open source under the GPLv2 license!