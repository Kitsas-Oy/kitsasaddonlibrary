import { Request } from 'express';
import {
  AddonLogDto,
  KitsasBookInterface,
  KitsasConnectionInterface,
  LanguageString,
  LogStatus,
  Notification,
  NotificationType,
} from 'kitsas-library';

import { AddonSession } from './addonSession.interface';

/**
 * Call information of addon
 *
 * This class is used to get information about the call, the user, the book etc. and to operate with Kitsas Server.
 *
 * Usually you get an instance of this class in the very first line of the route handlers.
 */
export class AddonCall {
  private request: Request;
  private session: AddonSession;

  /**
   * Constructor for AddonCall
   *
   * @param request - Request object from express
   */
  constructor(request: Request) {
    this.request = request;
    this.session = request.session as AddonSession;
  }

  /**
   * Get connection to Kitsas Server
   * @returns Connection to Kitsas Server
   */
  public connection(): KitsasConnectionInterface {
    return this.request.app.get('Addon').getConnection();
  }

  /**
   * Username
   *
   * @returns Name of the user
   */
  public userName(): string {
    return this.session.call?.user.name ?? '';
  }

  /**
   * User Id
   *
   * @returns Id of the user
   */
  public userId(): string {
    return this.session.call?.user.id ?? '';
  }

  /**
   * Organization (book) name
   *
   * @returns Name of the organization
   */
  public organizationName(): string {
    return this.session.call?.organization.name ?? '';
  }

  /**
   * Organization (book) Id
   *
   * @returns Id of the organization
   */
  public organizationId(): string {
    return this.session.call?.organization.id ?? '';
  }

  /**
   *
   * Rights of this sessios
   *
   * @returns Rights of this session
   */
  public rigths(): string[] {
    return this.session.call?.rights ?? [];
  }

  /**
   * Is the addon active i.e. does it have rights
   *
   * @returns True if the addon is active
   */
  public isActive(): boolean {
    return (
      (this.session.call?.rights && this.session.call?.rights?.length > 0) ||
      false
    );
  }

  /**
   * Log information
   *
   * @returns Log information
   */
  public logInfo() {
    return {
      user: this.userName(),
      userId: this.userId(),
      organization: this.organizationName(),
      organizationId: this.organizationId(),
    };
  }

  /**
   * Get session stored custom data
   * @param key Key of the data
   * @returns Data or undefined if not found
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get(key: string): any {
    return this.session.data?.[key] || undefined;
  }

  /**
   * Store custom data to session
   * @param key Key of the data
   * @param value Data value
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  set(key: string, value: any) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const oldObject: { [key: string]: any } = this.session.data || {};

    oldObject[key] = value;
    this.session.data = oldObject;
  }

  /**
   * Get language of the call
   * @returns Language code
   */
  language(): string {
    return this.session.language || 'fi';
  }

  /**
   * Weite to the log
   * @param status Status of the action
   * @param message Log message
   * @param data Additional data
   */
  async log(status: LogStatus, message: string, data?: object): Promise<void> {
    await this.connection().writeAddonLog(
      this.organizationId(),
      status,
      message,
      data
    );
  }

  /**
   * Read the log
   *
   * @returns Log entries
   */
  async getLogs(): Promise<AddonLogDto[]> {
    return await this.connection().getAddonLog(this.organizationId());
  }

  /**
   * Store data to the server
   *
   * @param key key of the data
   * @param data data value
   */
  async saveData(key: string, data: object): Promise<void> {
    await this.connection().saveData(this.organizationId(), key, data);
  }

  /**
   *
   * Fetch data stored on the server
   *
   * @param key key of the data
   * @returns data value
   */
  async getData(key: string): Promise<object> {
    return await this.connection().getData(this.organizationId(), key);
  }

  /**
   * Add a notify
   *
   * @param type Notification type
   * @param title Title, in languages
   * @param text Text, in languages
   * @param category Category of the notification
   */
  async notify(
    type: NotificationType,
    title: LanguageString,
    text: LanguageString,
    category?: string
  ): Promise<void> {
    await this.connection().addNotification(
      this.organizationId(),
      type,
      title,
      text,
      category
    );
  }

  /**
   * Add or replace notification with same type
   *
   * @param type Notification type
   * @param title Title, in languages
   * @param text Text, in languages
   * @param category Category of the notification
   */
  async replaceNotification(
    type: NotificationType,
    title: LanguageString,
    text: LanguageString,
    category: string
  ): Promise<void> {
    await this.connection().replaceNotification(
      this.organizationId(),
      type,
      title,
      text,
      category
    );
  }

  /**
   * List notifications
   *
   * @returns Notifications
   */
  async notifications(): Promise<Notification[]> {
    return await this.connection().getNotifications(this.organizationId());
  }

  /**
   * Get the book object to interact with the book
   *
   * @returns Book object
   */
  async getBook(): Promise<KitsasBookInterface> {
    return await this.connection().getBook(this.organizationId());
  }
}
