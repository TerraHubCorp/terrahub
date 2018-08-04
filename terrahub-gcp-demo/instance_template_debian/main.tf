resource "google_compute_instance_template" "instance_template_debian" {
  project     = "${var.project_id}"
  name        = "${var.name}"
  description = "${var.description}"

#  tags = ["terrahub", "demo"]
#
#  labels = {
#    environment = "demo"
#  }

  instance_description = "${var.instance_description}"
  machine_type         = "${var.machine_type}"
  can_ip_forward       = "${var.can_ip_forward}"

#  scheduling {
#    automatic_restart   = "${var.automatic_restart}"
#    on_host_maintenance = "MIGRATE"
#  }

  // Create a new boot disk from an image
  disk {
    source_image = "${var.disk_source_image}"
    auto_delete  = "${var.disk_auto_delete}"
    boot         = "${var.disk_boot}"
  }

  network_interface {
    network = "${var.network_interface_network}"
  }

#  metadata {
#    Env = "demo"
#  }
}
