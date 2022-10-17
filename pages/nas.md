---
title: NAS building log
layout: post
---

<strong>Log and documentation for my NAS build</strong>

> Wow an actual blog post on my _blog_ website?


# Build the computer

OS: Kubuntu 22.04.1 LTS

CPU: Intel i3-10105

GPU: Intel UHD Graphics 630

Memory: 8GB

PSU: 500W (idle power draw < 25W)

> Built the whole thing in one go, but it didn't POST the first time.
> To troubleshoot I pulled out everything from the motherboard except the CPU, RAM,
> power cables for CPU and MOBO, and HDMI cable.
> then it POST'ed successfully, so I tested repeatedly adding one connection
> at a time, and it POST'ed every time.
>
> No idea what the problem was.

Case: Fractal Design Node 304


# Setting up SSH

> eventually I'd like to do everything remotely, so SSH should be a good first step.
> It should allow connections from the local network only for now, not really planning
> to access this from the outside world any time soon.

download openssh-server and configure it:

```bash
sudo apt install openssh-server
sudo vim /etc/ssh/sshd_config.d/local_only.conf
sudo service ssh restart
```

local_only.conf:

```
# Disable all auth by default
PasswordAuthentication no
PubkeyAuthentication no

Match Address 192.168.0.*
        PubkeyAuthentication yes
        AllowUsers <user>
```

remember to switch password authentication on temporarily to copy ssh keys.

then to set up ssh key on client side:

```bash
ssh-copy-id -i ~/.ssh/<name>.pub -p 22 user@ipaddress
```

> ssh keys might be overkill on top of matching 192.168,
> but I guess more security doesn't hurt.

to SSH into server, either configure router DHCP so that the nas gets a fixed IP:

```bash
ssh user@ipaddress
```

or if DNS works in the local network:
```
ssh user@hostname
```

> TODO: this works on some of my local computers but not all?

> TODO: motherboard supports wake-on-lan, might want to try it out


# Setting up remote desktop

> Remote CLI works, now for remote GUI.
>
> NoMachine seems to have a lot more features but it feels like its meant to be
> configured and used through its GUI.
> Setting up VNC from SSH CLI would be cool but I still have my KB&M & monitor connected
> so might as well make use of them.

Download and install NoMachine on both server and client.

Initially this just shows a blackscreen because Ubuntu is too smart:

[Connecting to Linux headless machines with NoMachine](https://kb.nomachine.com/AR03P00973)

```bash
sudo systemctl stop sddm
sudo /etx/NX/nxserver --restart
```

> TODO: consider automating this on startup if no monitor is connected.


# Enable firewall

> You might want to do this earlier.

UFW is preinstalled, so we'll just use that:

```bash
sudo ufw allow ssh
sudo ufw allow 4000/tcp
sudo ufw allow 4011:4099/udp
sudo ufw enable
sudo ufw status
```

to check logs, first make sure logging is enabled:

```bash
sudo ufw status verbose
```

then the log should be stored at `/var/log/ufw.log`.

refer to this for more details on UFW logs:

[How Do I Check My UFW Log?](https://linuxhint.com/check-my-ufw-log/)

> TODO: NoMachine is supposed to configure firewall automatically but that didn't work?


# Setting up a terraria server

> This doesn't really help with the NAS thing but it's fun.

Upload the world save file with rsync:

```bash
rsync -av Terraria/Worlds/ <ipaddress>:games/ts/
```

download the server binary and set up a configuration file `server.conf`:

```
world=/home/<user>/games/ts/worlds/<world>.wld
maxplayers=4
port=<port>
password=<password>
motd=<motd>
worldpath=/home/<user>/games/ts/worlds
secure=1
language=en-US
npcstream=60
```

make sure the configuration file and the binary is in the same folder, and run:

```bash
./TerrariaServer.bin.x86_64 -config server.conf
```

remember to open the port in ufw, and the server should now be working.

to keep the server running and accesiable across SSH sessions, use screen:

```bash
screen
./TerrariaServer.bin.x86_64 -config server.conf
Ctrl+a d
```

to check if detach worked:

```bash
screen -list
```

and to reattach after the detach:

```bash
screen -r [session]
```


# Build more of the computer

The case used supports 6

