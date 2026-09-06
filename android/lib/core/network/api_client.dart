import 'dart:convert';
import 'dart:io';

import 'package:http/http.dart' as http;

import '../constants/app_constants.dart';

/// Raised for any failure talking to the FlashGuard backend — network
/// unreachable, timeout, or a non-2xx response. Callers decide how to
/// degrade (demo endpoint, cache, offline screen); this class only
/// classifies *why* the call failed.
class ApiException implements Exception {
  final String message;
  final int? statusCode;
  final bool isNetworkFailure;

  ApiException(this.message, {this.statusCode, this.isNetworkFailure = false});

  @override
  String toString() => 'ApiException($statusCode): $message';
}

/// Minimal JSON-over-HTTP client. Deliberately dependency-light (plain
/// `package:http`) rather than pulling in a heavier client, since the
/// backend surface here is a handful of GET/POST JSON endpoints.
class ApiClient {
  final http.Client _client;

  ApiClient({http.Client? client}) : _client = client ?? http.Client();

  Future<Map<String, dynamic>> getJson(String url) async {
    try {
      final response = await _client
          .get(Uri.parse(url), headers: {'Accept': 'application/json'})
          .timeout(ApiConfig.requestTimeout);
      return _decode(response);
    } on SocketException {
      throw ApiException('No network route to backend.', isNetworkFailure: true);
    } on HttpException {
      throw ApiException('Backend refused the connection.', isNetworkFailure: true);
    } on FormatException {
      throw ApiException('Backend returned malformed data.');
    } catch (e) {
      throw ApiException('Request failed: $e', isNetworkFailure: true);
    }
  }

  Future<Map<String, dynamic>> postJson(
    String url,
    Map<String, dynamic> body,
  ) async {
    try {
      final response = await _client
          .post(
            Uri.parse(url),
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            body: jsonEncode(body),
          )
          .timeout(ApiConfig.requestTimeout);
      return _decode(response);
    } on SocketException {
      throw ApiException('No network route to backend.', isNetworkFailure: true);
    } on HttpException {
      throw ApiException('Backend refused the connection.', isNetworkFailure: true);
    } on FormatException {
      throw ApiException('Backend returned malformed data.');
    } catch (e) {
      throw ApiException('Request failed: $e', isNetworkFailure: true);
    }
  }

  Map<String, dynamic> _decode(http.Response response) {
    if (response.statusCode < 200 || response.statusCode >= 300) {
      String detail = response.body;
      try {
        final parsed = jsonDecode(response.body);
        if (parsed is Map && parsed['detail'] != null) {
          detail = parsed['detail'].toString();
        }
      } catch (_) {
        // body wasn't JSON — fall back to raw text above
      }
      throw ApiException(detail, statusCode: response.statusCode);
    }
    final decoded = jsonDecode(response.body);
    if (decoded is Map<String, dynamic>) return decoded;
    if (decoded is List) return {'items': decoded};
    throw ApiException('Unexpected response shape.');
  }

  void dispose() => _client.close();
}
