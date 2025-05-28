# Messenger Companion

A smart assistant for iMessage that integrates AI capabilities directly into your conversations.

## Overview

Messenger Companion is built on top of the [BlueBubbles API](https://github.com/BlueBubblesApp/bluebubbles-server), which provides a server and API for interacting with iMessage on macOS. This project extends BlueBubbles by adding an AI-powered assistant that can respond to commands directly in your iMessage conversations.

## Features

- **AI Question Answering**: Ask questions to an AI assistant directly in your iMessage chats using the `/ask` command
- **Message Analysis**: Analyze conversation patterns and get insights using the `/analyze` command
- **Seamless Integration**: Works within your existing iMessage conversations

## How It Works

Messenger Companion connects to your BlueBubbles server and listens for specific commands in your messages. When it detects a command like `/ask` or `/analyze`, it processes the request using Claude AI and sends the response back as an iMessage.

### Available Commands

- `/ask [your question]` - Ask a question to Claude AI
- `/analyze` - Analyze recent messages in the conversation

## Requirements

- A Mac running macOS with iMessage configured
- [BlueBubbles Server](https://github.com/BlueBubblesApp/bluebubbles-server) installed and configured
- An Anthropic API key for Claude AI access

## Setup

[Setup instructions to be added]
