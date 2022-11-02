---
title: 2 - Improving the NAS
layout: post
parent: NAS building log
nav_order: 3
---

{: .fs-6}
Improving the NAS

1. TOC
{:toc}


# Configure disk spin down

Although spinning the disks up and down repeatedly causes more wear and tear than keeping it spinning,
if the drives are not used for a long time it can still be beneficial as it will reduce power consumption and noise.

Set the auto spin down timer to 10 minutes:

```bash
$ sudo hdparm -S 120 /dev/sda
$ sudo hdparm -S 120 /dev/sdb
$ sudo hdparm -S 120 /dev/sdc
```

Nothing spinned down after 10 minutes, and the culprit is Advanced Power Management.
APM levels above 128 does not allow drives to spin down.

```bash
$ sudo hdparm -B /dev/sda

/dev/sda:
 APM_level	= 254
$ sudo hdparm -B 127 /dev/sda

/dev/sda:
 setting Advanced Power Management level to 0x7f (127)
 APM_level	= 127
```

However, this doesn't work on the Seagate drives:

```bash
$ sudo hdparm -B 127 /dev/sdb
/dev/sdb:
 setting Advanced Power Management level to 0x7f (127)
SG_IO: bad/missing sense data, sb[]: ...
 APM_level	= not supported
```

Seagate drives requires `openSeaChest`:

```bash
sudo apt install make
sudo apt install gcc
git clone --recursive https://github.com/Seagate/openSeaChest.git
cd openSeaChest/Make/gcc
make release
cd openseachest_exes
```

Now we can configure the power modes:
```bash
$ sudo ./openSeaChest_PowerControl --device /dev/sdb  --EPCfeature enable
$ sudo ./openSeaChest_PowerControl --device /dev/sdb  --idle_a 1000 --idle_b 120000 --idle_c 300000 --standby_z 900000
```

To check that the current setting:
```bash
$ sudo ./openSeaChest_PowerControl -d /dev/sdb --showEPCSettings
==========================================================================================
 openSeaChest_PowerControl - openSeaChest drive utilities - NVMe Enabled
 Copyright (c) 2014-2022 Seagate Technology LLC and/or its Affiliates, All Rights Reserved
 openSeaChest_PowerControl Version: 3.2.0-3_2_1 X86_64
 Build Date: [---------]
 Today: [----------------------]	User: root
==========================================================================================

/dev/sg1 - ST4000[-----------]2[----] - ATA


===EPC Settings===
	* = timer is enabled
	C column = Changeable
	S column = Savable
	All times are in 100 milliseconds

Name       Current Timer Default Timer Saved Timer   Recovery Time C S
Idle A     *10           *10           *10           1             Y Y
Idle B     *1200         *6000         *1200         4             Y Y
Idle C     *3000          18000        *3000         25            Y Y
Standby Z  *9000          0            *9000         55            Y Y
```

The drive's electronics will enter power saving mode in 1 second,
heads will unload in 2 minutes, RPM will reduce at 5 minutes, and stop at 15 minutes.

To check the current power mode:
```bash
$ sudo ./openSeaChest_PowerControl -d /dev/sdb --checkPowerMode
```

To check the number of start/stop and load/unload cycles:
```bash
$ sudo ./openSeaChest_SMART -d /dev/sdb --smartAttributes raw | grep  -E "Start/Stop|Load-Unload"
```

{: .todo}
> there's also a low current spin up feature, but that's mostly used to prevent current spike when you spin up
> too many drives at the same time.


# Setting up Prometheus

## Prometheus

Install prometheus:

```bash
sudo apt install prometheus
```

Give the folders to the prometheus user:

```bash
sudo chown -R prometheus:prometheus /etc/prometheus/ /var/lib/prometheus/
sudo chmod -R 775 /etc/prometheus/ /var/lib/prometheus/
```

Configure it with `/etc/prometheus/prometheus.yml`

```yaml
# Sample config for Prometheus.

global:
  scrape_interval:     15s # Set the scrape interval to every 15 seconds. Default is every 1 minute.
  evaluation_interval: 15s # Evaluate rules every 15 seconds. The default is every 1 minute.
  # scrape_timeout is set to the global default (10s).

  # Attach these labels to any time series or alerts when communicating with
  # external systems (federation, remote storage, Alertmanager).
  external_labels:
      monitor: 'example'

# Alertmanager configuration
alerting:
  alertmanagers:
  - static_configs:
    - targets: ['localhost:<alert-port>']

# Load rules once and periodically evaluate them according to the global 'evaluation_interval'.
rule_files:
  # - "first_rules.yml"
  # - "second_rules.yml"

# A scrape configuration containing exactly one endpoint to scrape:
# Here it's Prometheus itself.
scrape_configs:
  # The job name is added as a label `job=<job_name>` to any timeseries scraped from this config.
  - job_name: 'prometheus'

    # Override the global default and scrape targets from this job every 5 seconds.
    scrape_interval: 5s
    scrape_timeout: 5s

    # metrics_path defaults to '/metrics'
    # scheme defaults to 'http'.

    static_configs:
      - targets: ['localhost:<prometheus-port>']

  - job_name: node
    # If prometheus-node-exporter is installed, grab stats about the local
    # machine by default.
    static_configs:
      - targets: ['localhost:<node-port>']
```


Make it into a service by creating `/etc/systemd/system/prometheus.service`:

```
[Unit]
Description=Prometheus
Wants=network-online.target
After=network-online.target

[Service]
User=prometheus
Group=prometheus
# Restart=always
Type=simple
ExecStart=/usr/bin/prometheus \
    --config.file=/etc/prometheus/prometheus.yml \
    --storage.tsdb.path=/var/lib/prometheus/ \
    --web.console.templates=/etc/prometheus/consoles \
    --web.console.libraries=/etc/prometheus/console_libraries \
    --web.listen-address=0.0.0.0:<prometheus-port>

[Install]
WantedBy=multi-user.target
```

Enable and run the service:

```bash
sudo systemctl enable prometheus
sudo systemctl start prometheus
sudo systemctl status prometheus
```

Open the port in firewall:

```bash
sudo ufw allow <prometheus-port>
```

Now we should be able to access it from `192.168.0.<nas-ip>:<prometheus-port>`.

## Prometheus-node-exporter

To obtain system data, we create a service running node-exporter by editing
`/etc/systemd/system/prometheus-node-exporter.service`.

```
[Unit]
Description=Node Exporter
After=network.target

[Service]
User=prometheus
Group=prometheus
Type=simple
ExecStart=/usr/bin/prometheus-node-exporter \
    --collector.filesystem.mount-points-exclude=^/(dev|proc|run|sys|media|var/lib/docker/.+)($|/)

[Install]
WantedBy=multi-user.target
```

{: .note}
> To change the port used, add `--web.listen-address=:<node-port>`


To restart a service:

```bash
sudo systemctl daemon-reload
sudo systemctl restart prometheus
```

Now we start prometheus-node-exporter, and new data points should become available.


# Setting up Grafana

Prometheus provides some basic visualisation but its nothing compared to what
Grafana can do.

```bash
wget https://dl.grafana.com/oss/release/grafana_9.2.3_amd64.deb
sudo dpkg -i grafana_9.2.3_amd64.deb
```

To configure, edit `/etc/grafana/grafana.ini`

```
# The http port to use
http_port = <grafana-port>
```

After allowing the port with ufw, we can now access it at `192.168.0.<nas-ip>:<grafana-port>`.


# Monitor Drive Power Mode

First we need to modify the `node-exporter` service to enable reading from textfiles.

```
ExecStart=/usr/bin/prometheus-node-exporter \
    --collector.textfile \
    --collector.textfile.directory=/var/lib/prometheus/textfiles \
    --collector.filesystem.mount-points-exclude=^/(dev|proc|run|sys|media|var/lib/docker/.+)($|/)
```


Move the `openSeaChest` executables to `local/bin`:

```bash
$ sudo cp git/openSeaChest/Make/gcc/openseachest_exes/* /usr/local/bin/
```

Write a script to extract the power mode data and feed it to Prometheus:

```bash
$ sudo vim /usr/local/bin/drive_powermode.sh
```

{: .highlight}
> This script is tweaked from: https://andrejacobs.org/linux/installing-prometheus-on-ubuntu-20-04/

```bash
#!/bin/bash
# Check drive states and report it as metrics for the node exporter textfile collector

echo '# HELP andre_drive_powermode Report the power mode of the /dev/sd? drives' > /var/lib/prometheus/textfiles/drive_powermode.prom
echo '# TYPE andre_drive_powermode gauge' >> /var/lib/prometheus/textfiles/drive_powermode.prom

function checkPowerMode() {
    local guage=10
    local powerMode=$(/usr/local/bin/openSeaChest_PowerControl -q -d $1 --checkPowerMode)

    if echo $powerMode | grep -q -w 'Active'; then
        guage=4
    elif echo $powerMode | grep -q -w 'Standby'; then
        guage=0
    elif echo $powerMode | grep -q -w 'Idle_c'; then
        guage=1
    elif echo $powerMode | grep -q -w 'Idle_b'; then
        guage=2
    elif echo $powerMode | grep -q -w 'Idle_a'; then
        guage=3
    fi

    echo "andre_drive_powermode{dev=\"$1\"} $guage" >> /var/lib/prometheus/textfiles/drive_powermode.prom
}

for drive in /dev/sd? ; do
    checkPowerMode $drive
done
```

Now we just need to hook the script to a timer:

```bash
$ sudo chown prometheus:prometheus drive_powermode.prom
$ sudo vim /etc/systemd/system/prometheus-drive-power.service
$ sudo vim /etc/systemd/system/prometheus-drive-power.timer
$ sudo systemctl enable --now prometheus-drive-power.timer
```

service:

```
[Unit]
Description=Run drive_powermode script for prometheus

[Service]
ExecStart=/usr/local/bin/drive_powermode.sh
```

timer:

```
[Unit]
Description=Run drive-powermode service every 15 seconds

[Timer]
OnBootSec=15
OnUnitActiveSec=15
AccuracySec=1

[Install]
WantedBy=timers.target
```

