---
title: NAS building log
layout: post
nav_order: 9
---

{: .fs-6}
Log and documentation for my NAS build

{: .highlight}
Wow an actual blog post on my _blog_ website?

1. TOC
{:toc}

# Build the computer

The target of this build is the Synology DS1522+ 5 bay desktop NAS which costs about £700.
We'll have a better CPU and one more bay for 60% of the cost.

|       |                              | Price(£) |
| ----- | ---------------------------- | -------: |
| OS    | Kubuntu 22.04.1 LTS          |     Free |
| MoBo  | ASRock H510M                 |   103.92 |
| CPU   | Intel i3-10105               |   109.99 |
| GPU   | Intel UHD Graphics 630       |          |
| RAM   | Corsair 8GB                  |    29.50 |
| PSU   | Be Quiet! 500W               |    46.26 |
| Case  | Fractal Design Node 304      |    99.98 |
| SSD   | Crucial 250G                 |    26.99 |
| Total |                              |   416.64 |

{: .highlight}
> Built the whole thing in one go, but it didn't POST the first time.
> To troubleshoot I pulled out everything from the motherboard except the CPU, RAM,
> power cables for CPU and MOBO, and HDMI cable.
> then it POST'ed successfully, so I tested repeatedly adding one connection
> at a time, and it POST'ed every time.
>
> No idea what the problem was.


# Setting up SSH

{: .highlight}
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

{: .highlight}
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

{: .todo}
> this works on some of my local computers but not all?

{: .todo}
> motherboard supports wake-on-lan, might want to try it out


# Setting up remote desktop

{: .highlight}
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

{: .todo}
> consider automating this on startup if no monitor is connected.


# Enable firewall

{: .note}
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

{: .todo}
> NoMachine is supposed to configure firewall automatically but that didn't work?


# Setting up a terraria server

{: .highlight}
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

{: .highlight}
> Setting maximum player to be exact seems to block players retrying connection after
> entering a wrong password

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

{: .note}
> tmux should work as well.


# Build more of the computer

The case has 6 mounting bays for 3.5 inch drives, but the motherboard only has 4 sata ports.
One of them is disabled if the M.2 slot is used, so we only have 3 usable.

We have a spare PCIe slot, so to expand the number of ports, we can install a HBA card:

The firmware should be in IT/HBA mode instead of RAID mode, which would allow the system
to see connected drives separately.

|             |                                                            | Price(£) |
| ----------- | ---------------------------------------------------------- | -------: |
| HBA         | [LSI SAS 9212-4i4e](https://docs.broadcom.com/doc/12353334)|    30.00 |
| HDD         | Seagate Ironwolf 4TB                                       |    83.99 |
| HDD         | Seagate Ironwolf 4TB                                       |    83.99 |
| HDD         | some OEM drive from old laptop 1TB                         |          |
| Misc        | 5x SATA cables                                             |     3.55 |
| Total       |                                                            |   201.53 |
| Grand Total |                                                            |   618.17 |

{: .highlight}
> SATA expansion cards is also a thing, but
> [this](https://unraid-guides.com/2020/12/07/dont-ever-use-cheap-pci-e-sata-expansion-cards-with-unraid/)
> gives a convincing argument why we should use HBA cards instead.

{: .note}
> cable management is a lot more difficult with such a small case and a lot of drives.

{: .highlight}
> Took me multiple times before it POST'ed again after installing the HDDs.
> I suspect the cause is me taking out the RAM stick out to make SATA slots more accessible, but
> it didn't go back in properly.

{: .todo}
> boot time seems to have slowed down a lot after installing the three drives?


# Badblocks

Test out to see if the drives are good:

```bash
badblocks -b 4096 -wsv /dev/sdX
```

This is limited by disk write speeds, so we can test multiple drives in parallel with screens.
It took about 18 hours for the 1TB HDD, and about 45 hours for the 4TB HDDs.

{: .highlight}
> A pessimistic estimation of the power cosumption is 25W idle and 50W during badblocks.
> With the electricity price at 35p/kW, and assuming the power draw averages at 30W,
> the running cost works out to be around £8 per month.


# Formatting the drives

