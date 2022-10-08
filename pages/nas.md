---
title: NAS building log
layout: post
---

<strong>Log and documentation for my NAS build</strong>

CPU: Intel i3-10105

OS: Kubuntu 22.04

## Setting up SSH

download openssh-server and configure it:

```bash
sudo apt install openssh-server
sudo vim /etc/ssh/sshd_config.d/local_only.conf
sudo service ssh restart
```

then to set up ssh key on client side:
```bash
ssh-copy-id -i ~/.ssh/<name>.pub -p 22 user@ipaddress
```

to SSH into server either setup router DHCP so that
the nas gets a fixed IP:
```bash
ssh user@ipaddress
```

or if somehow(?) get DNS working in the local network:
```
ssh user@hostname
```

## Setting up VNC

todo