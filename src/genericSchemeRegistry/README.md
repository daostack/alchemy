# GenericScheme Registry


One of the most flexible DAOstack schemes is the `GenericScheme`.

This is a scheme in which proposals can be made to execute any transaction on-chain.

Alchemy contains a system with which is is relatively easy to build an interface for interacting with any GenericScheme, and to generate forms such as the (dutchX controller form)[https://alchemy.daostack.io/dao/0x519b70055af55a007110b4ff99b0ea33071c720a/scheme/0xeca5415360191a29f12e1da442b9b050adf22c81b08230f1dafba908767e604f/proposals/create/]


# Registering the scheme in a DAOstack

[...]

A GenericScheme instance is always registered for a single contract - i.e. it can call any function on the given `contractToCall` address.

# Creating a custom interface for the Generic Scheme in Alchemy

Alchemy contains a system for generating forms for creating proposals in a Generic Scheme.
You can add your own scheme by adding your Generic Scheme to the registry.
(At the moment, the registry is a directory in Alchemy: https://github.com/daostack/alchemy/tree/dev/src/genericSchemeRegistry/schemes but in the future this may be moved to another location).

The steps to take are as follows:

1. Create a `.json` file in which it is specified which actions can be proposed on the scheme
2. register the `.json` file

## 1. Create the `.json`

An example can be found [here](https://github.com/daostack/alchemy/blob/dev/src/genericSchemeRegistry/schemes/DutchX.json)

The `.json` file contains the following sections:

- `name` the name of the scheme. This is used as an identifier and as the title of the scheme in alchemy
- `addresses` contains the addresses of the `contractToCall` deployments in various networks.
- `actions` represent the functions that can be called on the contract that is deployed at `contractToCall`. Each action as an `abi` value, which specifies the signature of the function. In addition, actions have an `id` (self-explanatory), a `label` and a `description` which will be shown on the form, and a list of `fields` that will generate fields in the form corresponding to the arguments specified in the `abi`

## 2. Register the file

*[This will change]*

Once you created your `.json` file, you can register it by editing the `src/genericSchemeRegistry/index.ts` file. You should import the file and add it to the `KNOWNSCHEMES` constant.
