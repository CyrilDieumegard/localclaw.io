#!/usr/bin/env swift

import Foundation
import Security

guard CommandLine.arguments.count == 4,
      CommandLine.arguments[1] == "set" else {
    FileHandle.standardError.write(Data("Usage: keychain-secret-bridge.swift set <service> <account>\n".utf8))
    exit(64)
}

let service = CommandLine.arguments[2]
let account = CommandLine.arguments[3]
let value = FileHandle.standardInput.readDataToEndOfFile()

guard !service.isEmpty, !account.isEmpty, !value.isEmpty else {
    FileHandle.standardError.write(Data("Service, account and stdin value are required.\n".utf8))
    exit(65)
}

let query: [CFString: Any] = [
    kSecClass: kSecClassGenericPassword,
    kSecAttrService: service,
    kSecAttrAccount: account
]

let existsStatus = SecItemCopyMatching(query as CFDictionary, nil)
let status: OSStatus
if existsStatus == errSecSuccess {
    status = SecItemUpdate(query as CFDictionary, [kSecValueData: value] as CFDictionary)
} else if existsStatus == errSecItemNotFound {
    var add = query
    add[kSecValueData] = value
    add[kSecAttrLabel] = "LocalClaw licence signing \(account)"
    status = SecItemAdd(add as CFDictionary, nil)
} else {
    status = existsStatus
}

guard status == errSecSuccess else {
    FileHandle.standardError.write(Data("Keychain operation failed with OSStatus \(status).\n".utf8))
    exit(66)
}
