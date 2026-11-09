import { BadRequestException, CanActivate, Controller, createParamDecorator, ExecutionContext, ForbiddenException, Injectable, Module, Post, Body, UnauthorizedException } from '@nestjs/common';
import { InjectRepository, TypeOrmModule } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as jwt from 'jsonwebtoken';
import { Account } from '../entities';

/**
 * Sign-in is a provider behind one interface. The dev provider turns a typed name into an account
 * so the whole flow runs without external configuration. Google (Firebase Auth) is the documented swap:
 * verify the ID token, then upsert the account by (provider, subject) exactly as below.
 */
export interface Identity { provider: string; subject: string; name: string }

@Injectable()
export class AuthService {
  constructor(@InjectRepository(Account) private readonly accounts: Repository<Account>) {}
  private secret() { return process.env.JWT_SECRET || 'dev-only-secret-change-me'; }

  async signInDev(name: string, moderator: boolean): Promise<{ token: string; account: Account }> {
    if (process.env.AUTH_PROVIDER && process.env.AUTH_PROVIDER !== 'dev') throw new ForbiddenException('Dev sign-in is disabled');
    const clean = String(name || '').trim().slice(0, 60);
    if (clean.length < 2) throw new BadRequestException('Enter a name of at least two characters');
    return this.issue({ provider: 'dev', subject: clean.toLowerCase(), name: clean }, moderator);
  }

  async issue(id: Identity, moderator = false): Promise<{ token: string; account: Account }> {
    let account = await this.accounts.findOne({ where: { provider: id.provider, subject: id.subject } });
    if (!account) account = await this.accounts.save(this.accounts.create({ provider: id.provider, subject: id.subject, name: id.name, isModerator: moderator }));
    else if (moderator && !account.isModerator) { account.isModerator = true; await this.accounts.save(account); }
    const token = jwt.sign({ sub: account.id, name: account.name, mod: account.isModerator }, this.secret(), { expiresIn: '7d' });
    return { token, account };
  }

  async verify(token: string): Promise<Account> {
    let payload: any;
    try { payload = jwt.verify(token, this.secret()); } catch { throw new UnauthorizedException('Sign in to continue'); }
    const account = await this.accounts.findOne({ where: { id: payload.sub } });
    if (!account) throw new UnauthorizedException('Sign in to continue');
    return account;
  }
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly auth: AuthService) {}
  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest();
    const header: string = req.headers.authorization || '';
    if (!header.startsWith('Bearer ')) throw new UnauthorizedException('Sign in to continue');
    req.account = await this.auth.verify(header.slice(7));
    return true;
  }
}

@Injectable()
export class ModeratorGuard extends AuthGuard {
  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    await super.canActivate(ctx);
    const req = ctx.switchToHttp().getRequest();
    if (!req.account.isModerator) throw new ForbiddenException('Moderators only');
    return true;
  }
}

export const CurrentAccount = createParamDecorator((_: unknown, ctx: ExecutionContext): Account => ctx.switchToHttp().getRequest().account);

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}
  /** Development-only sign-in: a name becomes an account. `moderator: true` grants the moderator flag (dev only). */
  @Post('dev')
  async dev(@Body() body: { name?: string; moderator?: boolean }) {
    const { token, account } = await this.auth.signInDev(body?.name ?? '', body?.moderator === true);
    return { token, account: { id: account.id, name: account.name, isModerator: account.isModerator } };
  }
}

@Module({ imports: [TypeOrmModule.forFeature([Account])], providers: [AuthService, AuthGuard, ModeratorGuard], controllers: [AuthController], exports: [AuthService, AuthGuard, ModeratorGuard] })
export class AuthModule {}
