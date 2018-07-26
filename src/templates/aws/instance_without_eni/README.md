# aws_instance

Provides an EC2 instance resource. This allows instances to be created, updated, and deleted. Instances also support provisioning.

## input variables

| Name | Description | Type | Default | Required |
|------|-------------|:----:|:-----:|:-----:|
|account_id|The id of AWS account.|string||Yes|
|region|This is the AWS region.|string|us-east-1|Yes|
|instance_name|The name of instance.|string|{{ name }}|No|
|instance_ami|The AMI to use for the instance.|string||Yes|
|instance_instance_type|The type of instance to start. Updates to this field will trigger a stop/start of the EC2 instance.|string||Yes|
|instance_key_name|The key name of the Key Pair to use for the instance; which can be managed using the aws_key_pair resource.|string||Yes|
|instance_iam_instance_profile|The IAM Instance Profile to launch the instance with. Specified as the name of the Instance Profile. Ensure your credentials have the correct permission to assign the instance profile according to the EC2 documentation, notably iam:PassRole.|string||Yes|
|instance_vpc_security_group_ids|A list of security group IDs to associate with.|list||Yes|
|instance_subnet_id|The VPC Subnet ID to launch in.|string||Yes|
|associate_public_ip_address|Associate a public ip address with an instance in a VPC. Boolean value.|boolean|false|No|
|instance_ebs_optimized|If true, the launched EC2 instance will be EBS-optimized. Note that if this is not set on an instance type that is optimized by default then this will show as disabled but if the instance type is optimized by default then there is no need to set this and there is no effect to disabling it.|boolean|true|No|
|instance_disable_api_termination|If true, enables EC2 Instance Termination Protection.|boolean|true|No|
|instance_monitoring|If true, the launched EC2 instance will have detailed monitoring enabled.|boolean|false|No|
|instance_ebs_device_name|The name of the device to mount.|string|/dev/sdb|No|
|instance_ebs_volume_type|The type of volume. Can be standard, gp2, or io1. (Default: standard).|string|standard|No|
|instance_ebs_volume_size|The size of the volume in gigabytes.|number|8|No|
|instance_ebs_delete_on_termination|Whether the volume should be destroyed on instance termination (Default: true).|boolean|true|No|
|instance_ebs_encrypted|Enables EBS encryption on the volume (Default: false). Cannot be used with snapshot_id.|boolean|false|No|
|custom_tags|Custom tags.|map||No|
|default_tags|Default tags.|map|{"ThubName"= "{{ name }}","ThubCode"= "{{ code }}","ThubEnv"= "default","Description" = "Managed by TerraHub"}|No|

## output parameters

| Name | Description | Type |
|------|-------------|:----:|
|id|The instance ID.|string|
|availability_zone|The availability zone of the instance.|string|
|placement_group|The placement group of the instance.|string|
|key_name|The key name of the instance.|string|
|password_data|Base-64 encoded encrypted password data for the instance. Useful for getting the administrator password for instances running Microsoft Windows. This attribute is only exported if get_password_data is true. Note that this encrypted value will be stored in the state file, as with all exported attributes. See GetPasswordData for more information.|string|
|public_dns|The public DNS name assigned to the instance. For EC2-VPC, this is only available if you've enabled DNS hostnames for your VPC|string|
|public_ip|The public IP address assigned to the instance, if applicable. NOTE: If you are using an aws_eip with your instance, you should refer to the EIP's address directly and not use public_ip, as this field will change after the EIP is attached.|string|
|ipv6_addresses|A list of assigned IPv6 addresses, if any.|string|
|network_interface_id|The ID of the network interface that was created with the instance.|string|
|primary_network_interface_id|The ID of the instance's primary network interface.|string|
|private_dns|The private DNS name assigned to the instance. Can only be used inside the Amazon EC2, and only available if you've enabled DNS hostnames for your VPC.|string|
|private_ip|The private IP address assigned to the instance|string|
|security_groups|The associated security groups.|string|
|vpc_security_group_ids|The associated security groups in non-default VPC|string|
|subnet_id|The VPC subnet ID.|string|
|credit_specification|Credit specification of instance.|string|
