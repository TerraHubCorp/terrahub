# TerraHub

TerraHub is a Terraform-centric devops tool that helps provision and manage large amount of cloud resources and cloud services across cloud providers. For example: Serverless on Amazon AWS, Google Cloud or Microsoft Azure.

## Commands

```
  apply ............. run `terraform apply` across multiple terraform scripts
  build ............. build software from predefined build.yml config files
  create ............ create terraform code from predefined templates
  deploy ............ deploy software from predefined deploy.yml config files
  destroy ........... run `terraform destroy` across multiple terraform scripts
  init .............. run `terraform init` across multiple terraform scripts
  list .............. list cloud accounts > regions > applications > services > resources
  plan .............. run `terraform plan` across multiple terraform scripts
  refresh ........... run `terraform refresh` across multiple terraform scripts
  show .............. run `terraform show` across multiple terraform scripts
  workspace .........
  run ...............
  project ...........
```

## @todo

- Fix `stdout` issue
- Implement pre/post hooks
```javascript
  terraform.prepare()
    .then(() => Promise.resolve()) // run pre-hook
    .then(() => terraform.apply())
    .then(() => Promise.resolve()) // run post-hook
    .then(() => Promise.resolve('Done'));
```
```yml
# config example
hooks:
  plan: 
    before: './path/file.js'
    after: './path/file.js'
```
- Move terraform binary version => `~/.terrahub/terraform/0.11.7/...`
- Add hook templates to `~/.terrahub/hooks/...`
- Add Empty `~/.terrahub/.terrahub.(yml|yaml|json)` (for now)
- Implement `--include === -i xxx,yyy,zzz` (use module.name)
