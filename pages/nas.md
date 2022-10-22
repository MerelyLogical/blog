---
title: NAS building log
layout: post
nav_order: 9
---

{: .fs-6}
Log and documentation for my NAS build

{: .highlight}
> Wow an actual blog post on my _blog_ website?

1. TOC
{:toc}

# Build the computer

The target of this build is the Synology DS1522+ 5 bay desktop NAS which costs about £700.
This will have a better CPU and one more bay for 60% of the cost.

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

Alternatively run this screen after startup if GUI is not needed.

```bash
sudo systemctl stop sddm
sudo /etc/NX/nxserver --shutdown
```


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


# Setting up a Terraria server

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

{: .note}
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
One of them is disabled if the M.2 slot is used, so there're only have 3 usable.

We have a spare PCIe slot, so to expand the number of ports, a HBA card can be installed:

The firmware should be in IT/HBA mode instead of RAID mode, which would allow the system
to see connected drives separately.

|             |                                                            | Price(£) |
| ----------- | ---------------------------------------------------------- | -------: |
| HBA         | [LSI SAS 9212-4i4e](https://docs.broadcom.com/doc/12353334)|    30.00 |
| HDD         | Seagate Ironwolf 4TB                                       |    83.99 |
| HDD         | Seagate Ironwolf 4TB                                       |    83.99 |
| HDD         | HGST Travelstar(?) 1TB (pulled from old laptop)            |          |
| Misc        | 5x SATA cables                                             |     3.55 |
| Total       |                                                            |   201.53 |
| Grand Total |                                                            |   618.17 |

{: .note}
> SATA expansion cards is also a thing, but
> [this](https://unraid-guides.com/2020/12/07/dont-ever-use-cheap-pci-e-sata-expansion-cards-with-unraid/)
> gives a convincing argument why HBA cards should be used instead.

{: .highlight}
> Took me multiple times before it POST'ed again after installing the HDDs.
> I suspect the cause is me taking out the RAM stick out to make SATA slots more accessible, but
> it didn't go back in properly.
>
> Cable management is a lot more difficult with such a small case and a lot of drives.

{: .todo}
> Boot time seems to have slowed down a lot after installing the three drives?


# Badblocks

Test out to see if the drives are good:

```bash
badblocks -b 4096 -wsv /dev/sdX
```

This is limited by disk write speeds, so we can test multiple drives in parallel with screens.
It took about 18 hours for the 1TB HDD, and about 50 hours for the 4TB HDDs.

{: .note}
> Don't know how to use screens? Well you shouldn't have skipped the Terraria section :)

{: .highlight}
> A pessimistic estimation of the power cosumption is 25W idle and 50W during badblocks.
> With the electricity price at 35p/kW, and assuming the power draw averages at 30W,
> the running cost works out to be around £8 per month.


# Formatting the drives

To check which drive is which:

```bash
$ ll /dev/disk/by-id
...
ata-HGST_[----------------] -> ../../sda
ata-ST4000[-----------]2[-] -> ../../sdb
ata-ST4000[-----------]3[-] -> ../../sdc
```

Using `gdisk` to partition the drives:

```bash
sudo gdisk /dev/sda
o   #create a new empty GUID partition table (GPT)
n   #add a new partition
w   #write table to disk and exit
```

At each step the options can be left at the default values.

After repeating it on all drives we can check that the partition has been created with lsblk:

```bash
$ lsblk
...
sda           8:0    0 931.5G  0 disk
└─sda1        8:1    0 931.5G  0 part
sdb           8:16   0   3.6T  0 disk
└─sdb1        8:17   0   3.6T  0 part
sdc           8:32   0   3.6T  0 disk
└─sdc1        8:33   0   3.6T  0 part
```

To create an `ext4` filesystem:

```bash
sudo mkfs.ext4 /dev/sda1
```


# Setting up MergerFS

Install MergerFS:

```bash
sudo apt install mergerfs
```

Confirming the ID of our partitions:

```bash
$ ll /dev/disk/by-id
...
ata-HGST_[----------------] -> ../../sda
ata-HGST_[----------------]-part1 -> ../../sda1
ata-ST4000[-----------]2[-] -> ../../sdb
ata-ST4000[-----------]2[-]-part1 -> ../../sdb1
ata-ST4000[-----------]3[-] -> ../../sdc
ata-ST4000[-----------]3[-]-part1 -> ../../sdc1
```

The parity drive should be of the size of the largest drive, so the plan is to use one of the
4TB drives as parity, and the rest as data drives.

MergerFS is configured with `/etc/fstab`:

```bash
$ sudo vim /etc/fstab
...
# <file system>                                   <mount point> <type> <options> <dump> <pass>
/dev/disk/by-id/ata-ST4000[-----------]2[-]-part1 /mnt/parity0  ext4   defaults  0      0
/dev/disk/by-id/ata-ST4000[-----------]3[-]-part1 /mnt/disk0    ext4   defaults  0      0
/dev/disk/by-id/ata-HGST_[----------------]-part1 /mnt/disk1    ext4   defaults  0      0

/mnt/disk0:/mnt/disk1 /mnt/main fuse.mergerfs defaults,nonempty,allow_other,use_ino,cache.files=off,moveonenospc=true,dropcacheonclose=true,minfreespace=100G,category.create=mfs,fsname=mergerfs 0 0
```

Check that the new lines in `/etc/fstab` works before rebooting the system:

```bash
$ mkdir /mnt/parity0
$ mkdir /mnt/data0
$ mkdir /mnt/data1
$ mkdir /mnt/main
$ mount -a
$ df -h
Filesystem      Size  Used Avail Use% Mounted on
...
/dev/sdb1       3.6T   28K  3.4T   1% /mnt/parity0
/dev/sdc1       3.6T   28K  3.4T   1% /mnt/data0
/dev/sda1       916G   28K  870G   1% /mnt/data1
mergerfs        4.5T   56K  4.3T   1% /mnt/main
```

{: .note}
> If you made the mistake of using `sudo mkdir /mnt/<name>` like me, to pass the ownership of
> the mount points back to the user, use:
> `sudo chown -R <user>:<user> /mnt/<name>`

# Setting up SnapRAID

