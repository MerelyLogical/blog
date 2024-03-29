---
title: 1 - Building a NAS
layout: post
parent: NAS building log
nav_order: 2
---

{: .fs-6}
Building a NAS

1. TOC
{:toc}

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


# Remove snap

{: .note}
> This is probably not a good idea, but let's remove `snap`.

First disable all `snapd` services:

```bash
sudo systemctl disable snapd.service
sudo systemctl disable snapd.socket
...
```

Then uninstall all snap packages with `snapd` as the last one:

```bash
sudo snap list
sudo snap remove firefox
...
sudo snap remove snapd
```

Delete its cache:

```bash
sudo rm -rf /var/cache/snapd/
```

Delete it from `apt`:

```bash
sudo apt autoremove --purge snapd
rm -rf ~/snap/
```

Create `/etc/apt/preferences.d/nosnap.perf` to make sure it doesn't accidentally comeback:

```bash
Package: snapd
Pin: release a=*
Pin-Priority: -10
```


# Install fancy CLI system monitors

{: .highlight}
> I've been hearing a consistent but low amount of disk activity since mounting the drives,
> so let's install a few good (looking) system monitors to figure out why.

To install `btop` and `iotop`:

```bash
sudo apt install btop
sudo apt install iotop-c
```

{: .highlight}
> With `iotop` I see that `jbd2/sd*` is regularly writing to the new drives.
> That means `ext4` is still initialising, so there's nothing to worry about.


# Check connection speeds

To test the connection speeds between the machines, we can use `iperf3`:

```bash
sudo apt install iperf3
```

To start listening on the server side:

```bash
$ iperf3 -s -p <port>
```

Then we launch the test from the client side:

```bash
$ iperf3 -c <ipaddress> -p <port>
...
[ ID] Interval           Transfer     Bitrate         Retr
[  5]   0.00-10.00  sec  1.10 GBytes   944 Mbits/sec    0             sender
[  5]   0.00-10.03  sec  1.10 GBytes   941 Mbits/sec                  receiver

iperf Done.
```


# Setting up SnapRAID

Install SnapRAID as usual:

```bash
sudo apt install snapraid
```

Checking its versions directly returns `vnone`, but checking it through `apt` gives a more sensible result:

{: .note}
> What could go possibly wrong?

```bash
$ snapraid --version
snapraid vnone by Andrea Mazzoleni, http://www.snapraid.it

$ apt list snapraid
Listing... Done
snapraid/jammy,now 12.1-1 amd64 [installed]
```

SnapRAID is configured with `/etc/snapraid.conf`:

```
parity /mnt/parity0/snapraid.parity

content /var/snapraid/snapraid.content
content /mnt/data0/snapraid.content
content /mnt/data1/snapraid.content

data d0 /mnt/data0/
data d1 /mnt/data1/

nohidden

exclude /tmp/
exclude /lost+found/
```

Now we just need to run:

```bash
snapraid sync
```

{: .note}
> use `chmod` to make sure the `.content` and `.parity` files are owned by the user,
> since `snapraid sync` should not require `sudo`.
